import importlib
import os
import io

import numpy as np
import pdfplumber
import pytesseract
from PIL import Image
from fastapi import HTTPException, status
import easyocr

from app.core.config import settings

reader = None


def configure_tesseract():
    """Configure Tesseract CLI path if set in environment configuration."""
    if settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
    elif os.name == 'nt':
        default_win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(default_win_path):
            pytesseract.pytesseract.tesseract_cmd = default_win_path


def get_easyocr_reader():
    global reader
    if reader is None:
        reader = easyocr.Reader(['en'], gpu=False)
    return reader


def _extract_text_from_pil_image(image: Image.Image) -> str:
    """Extract text from a PIL image using Tesseract with EasyOCR fallback."""
    configure_tesseract()

    try:
        extracted_text = ""
        try:
            extracted_text = pytesseract.image_to_string(image)
            if extracted_text and extracted_text.strip():
                return extracted_text.strip()
        except Exception:
            pass

        image_np = np.array(image)
        results = get_easyocr_reader().readtext(image_np, detail=0)
        extracted_text = "\n".join([part for part in results if part]).strip()
        if extracted_text:
            return extracted_text

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="OCR was unable to extract any text from the uploaded image. Please ensure it is clear."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"OCR analysis failed: {str(e)}"
        )


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF using pdfplumber, with a scanned-PDF OCR fallback."""
    text = ""
    scanned_text = ""

    pdf2image_spec = importlib.util.find_spec("pdf2image")
    convert_from_bytes = None
    if pdf2image_spec is not None:
        try:
            pdf2image = importlib.import_module("pdf2image")
            convert_from_bytes = pdf2image.convert_from_bytes
        except Exception:
            convert_from_bytes = None

    pdfplumber_error = None
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    text += page_text + "\n"
                else:
                    image = None
                    if convert_from_bytes is not None:
                        try:
                            images = convert_from_bytes(file_bytes, dpi=300, first_page=page.page_number, last_page=page.page_number)
                            if images:
                                image = images[0].convert('RGB')
                        except Exception:
                            image = None

                    if image is None:
                        try:
                            page_image = page.to_image(resolution=300).original.convert('RGB')
                            image = page_image
                        except Exception:
                            image = None

                    if image is not None:
                        try:
                            scanned_text += _extract_text_from_pil_image(image) + "\n"
                        except HTTPException:
                            pass
                        except Exception:
                            pass
    except Exception as e:
        pdfplumber_error = str(e)

    if pdfplumber_error and convert_from_bytes is not None:
        try:
            images = convert_from_bytes(file_bytes, dpi=300)
            for image in images:
                try:
                    scanned_text += _extract_text_from_pil_image(image.convert('RGB')) + "\n"
                except HTTPException:
                    pass
                except Exception:
                    pass
        except Exception:
            pass

    extracted = text.strip()
    if extracted:
        return extracted

    scanned_extracted = scanned_text.strip()
    if scanned_extracted:
        return scanned_extracted

    if pdfplumber_error:
        detail = (
            "The uploaded PDF could not be parsed as selectable text. "
            "The system attempted OCR on rendered pages but could not extract readable text. "
        )
        if convert_from_bytes is None:
            detail += (
                "Install `pdf2image` and Poppler for better scanned-PDF support, or upload a clear image file."
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )

    if convert_from_bytes is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "The uploaded PDF appears to be a scanned document with no selectable text. "
                "The backend attempted OCR on the PDF pages, but `pdf2image` is not installed. "
                "Install `pdf2image` and Poppler, or upload a clear image file instead."
            )
        )

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=(
            "The uploaded PDF appears to be a scanned document with no selectable text. "
            "The system attempted OCR on rendered pages but could not extract readable text. "
            "Please ensure the document is clear and try again."
        )
    )


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from an image using Tesseract with EasyOCR fallback."""
    configure_tesseract()

    try:
        image = Image.open(io.BytesIO(file_bytes)).convert('RGB')
        return _extract_text_from_pil_image(image)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"OCR analysis failed: {str(e)}"
        )


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Main text extractor; dispatches based on file type."""
    ext = os.path.splitext(filename.lower())[1]

    if ext == ".pdf":
        extracted = extract_text_from_pdf(file_bytes)
        if not extracted:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "The uploaded PDF appears to be a scanned document (no text selectable). "
                    "To extract lab values, please upload a digital text-based PDF or an image file (PNG/JPG)."
                )
            )
        return extracted
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
        extracted = extract_text_from_image(file_bytes)
        if not extracted:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="OCR was unable to extract any text from the uploaded image. Please ensure it is clear."
            )
        return extracted
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, PNG, JPG, JPEG."
        )
