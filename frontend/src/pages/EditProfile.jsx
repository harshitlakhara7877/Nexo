import { ArrowLeft, Check, Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/userService";

const MAX_BIO_LENGTH = 150;
const MAX_NAME_LENGTH = 50;

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    bio: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      name: user.name || "",
      bio: user.bio || "",
    });
  }, [user]);

  const initials = (
    user?.name ||
    user?.username ||
    "U"
  )
    .charAt(0)
    .toUpperCase();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({...previous,[name]: value}));

    setErrors((previous) => ({...previous,[name]: ""}));
  };

  const validate = () => {
    const newErrors = {};

    const trimmedName = form.name.trim();
    const trimmedBio = form.bio.trim();

    if (!trimmedName) {
      newErrors.name = "Name is required";
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      newErrors.name = `Name must be ${MAX_NAME_LENGTH} characters or less`;
    }

    if (trimmedBio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `Bio must be ${MAX_BIO_LENGTH} characters or less`;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const data = await updateProfile({
        name: form.name.trim(),
        bio: form.bio.trim(),
      });

      setUser(data.user);

      toast.success("Profile updated successfully");

      navigate("/profile");
    } catch (error) {
      const responseData = error.response?.data;

      if (responseData?.errors) {
        setErrors(responseData.errors);
      }

      toast.error(
        responseData?.message ||
          "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <p className="text-sm text-[#686A72]">
          Unable to load profile.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="rounded-full"
          >
            <ArrowLeft size={19} />
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1B1C20]">
              Edit Profile
            </h1>

            <p className="mt-1 text-sm text-[#686A72]">
              Update your Nexo profile.
            </p>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white"
        >
          <div className="space-y-7 p-5 sm:p-8">

            {/* Profile photo */}
            <div className="flex items-center gap-5">
              <Avatar className="size-20 border-4 border-white shadow-sm">
                <AvatarImage
                  src={user.profilePicture || undefined}
                  alt={user.username}
                />

                <AvatarFallback className="bg-[#FFF0E8] text-xl font-semibold text-[#FF4D00]">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm font-medium text-[#1B1C20]">
                  Profile photo
                </p>

                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="mt-2 border-[#FF4D00] text-[#FF4D00]"
                >
                  <Camera size={16} />
                  Change Photo
                </Button>

                <p className="mt-1.5 text-xs text-[#9A9CA3]">
                  Photo upload will be available in Phase 6.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-[#1B1C20]"
              >
                Name
              </label>

              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={MAX_NAME_LENGTH}
                placeholder="Enter your name"
                className="h-11 border-[#E4E1DB] focus-visible:border-[#FF4D00] focus-visible:ring-[#FF4D00]/20"
              />

              {errors.name && (
                <p className="text-xs text-[#D94B4B]">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-[#1B1C20]"
              >
                Username
              </label>

              <div className="relative">
                <Input
                  id="username"
                  value={user.username || ""}
                  disabled
                  className="h-11 border-[#E4E1DB] bg-[#F7F6F3] pr-10 text-[#686A72]"
                />

                <Check
                  size={17}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2E9E6F]"
                />
              </div>

              <p className="text-xs text-[#9A9CA3]">
                Username cannot be changed here.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="bio"
                  className="text-sm font-medium text-[#1B1C20]"
                >
                  Bio
                </label>

                <span
                  className={`text-xs ${
                    form.bio.length > MAX_BIO_LENGTH
                      ? "text-[#D94B4B]"
                      : "text-[#9A9CA3]"
                  }`}
                >
                  {form.bio.length}/{MAX_BIO_LENGTH}
                </span>
              </div>

              <Textarea
                id="bio"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                maxLength={MAX_BIO_LENGTH}
                placeholder="Tell people a little about yourself..."
                rows={4}
                className="resize-none border-[#E4E1DB] focus-visible:border-[#FF4D00] focus-visible:ring-[#FF4D00]/20"
              />

              {errors.bio && (
                <p className="text-xs text-[#D94B4B]">
                  {errors.bio}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EEECE8] bg-[#FCFBF9] p-5 sm:flex-row sm:justify-end sm:p-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="border-[#E4E1DB]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="bg-[#FF4D00] text-white hover:bg-[#E64400]"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditProfile;