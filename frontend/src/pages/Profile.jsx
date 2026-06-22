import { useState } from "react";
import { UserCog, Save, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword } from "../api/authApi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [sex, setSex] = useState(user?.sex || "");
  const [dob, setDob] = useState(user?.date_of_birth || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  const inputClass = "premium-input w-full px-3.5 py-2.5 text-xs font-medium";
  const labelClass = "text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5";

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile({
        full_name: fullName || null,
        sex: sex || null,
        date_of_birth: dob || null,
      });
      updateUser(updated);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not update profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPwdMsg({ type: "success", text: "Password updated successfully." });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setPwdMsg({
        type: "error",
        text: typeof detail === "string" ? detail : "Could not change password.",
      });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-9 w-9 items-center justify-center flex rounded-lg bg-indigo-500/10 text-indigo-400">
          <UserCog className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white">Profile & Settings</h1>
          <p className="text-xs text-slate-500">
            Keep your details current — sex and date of birth personalize your biomarker reference ranges.
          </p>
        </div>
      </div>

      {/* Profile card */}
      <Card className="p-6">
        <h4 className="font-display font-bold text-white text-sm mb-5 border-b border-slate-800/80 pb-3">
          Personal Details
        </h4>

        {profileMsg && (
          <div className="mb-4">
            <Alert variant={profileMsg.type === "success" ? "success" : "error"}
              icon={profileMsg.type === "success" ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}>
              {profileMsg.text}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className={labelClass}>Email (read-only)</label>
            <input className={`${inputClass} opacity-60 cursor-not-allowed`} value={user?.email || ""} disabled />
          </div>
          <div>
            <label className={labelClass}>Full Name</label>
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sex</label>
              <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" className={inputClass} value={dob || ""} onChange={(e) => setDob(e.target.value)} />
            </div>
          </div>
          <Button type="submit" loading={savingProfile} icon={<Save className="h-4 w-4" />} className="inline-flex items-center gap-2 justify-center px-5 py-2.5 text-xs">
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Change password card */}
      <Card className="p-6">
        <h4 className="font-display font-bold text-white text-sm mb-5 border-b border-slate-800/80 pb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-400" />
          Change Password
        </h4>

        {pwdMsg && (
          <div className="mb-4">
            <Alert variant={pwdMsg.type === "success" ? "success" : "error"}
              icon={pwdMsg.type === "success" ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}>
              {pwdMsg.text}
            </Alert>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelClass}>Current Password</label>
            <input type="password" className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>New Password (min 6 chars)</label>
            <input type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
          </div>
          <Button type="submit" loading={savingPwd} icon={<KeyRound className="h-4 w-4" />} className="inline-flex items-center gap-2 justify-center px-5 py-2.5 text-xs">
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
