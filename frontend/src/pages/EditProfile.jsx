import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../services/userService";

const MAX_NAME_LENGTH = 50;
const MAX_BIO_LENGTH = 150;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;


export default function EditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    user?.profilePicture?.url || ""
  );

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /*
   * Keep the form synchronized if the authenticated
   * user changes while this page is mounted.
   */
  useEffect(() => {
    if (!user) return;

    setName(user.name || "");
    setBio(user.bio || "");
    setPreviewUrl(user.profilePicture?.url || "");
  }, [user]);

  /*
   * Clean up temporary object URL when the component
   * is unmounted or the preview changes.
   */
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateForm = () => {
    const newErrors = {};

    const trimmedName = name.trim();
    const trimmedBio = bio.trim();

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

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, JPEG, and WebP images are allowed");

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Profile image must be smaller than 5 MB");

      event.target.value = "";
      return;
    }

    /*
     * Revoke the previous temporary preview URL.
     */
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const newPreviewUrl = URL.createObjectURL(file);

    setProfilePicture(file);
    setPreviewUrl(newPreviewUrl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;


    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      /*
       * Use FormData because we may be
       * sending an image file.
       */
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("bio", bio.trim());

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const data = await updateProfile(formData);

      /*
       * Update AuthContext so the new profile
       * information is immediately available
       * throughout the application.
       */
      if (data?.user) {
        setUser(data.user);
      }

      toast.success("Profile updated successfully");

      navigate("/profile");
    } catch (error) {
      console.error("Profile update error:", error);

      const responseData = error.response?.data;

      /*
       * Backend validation errors.
       */
      if (responseData?.errors) {
        setErrors(responseData.errors);

        if (responseData.errors.name) {
          toast.error(responseData.errors.name);
        } else if (responseData.errors.bio) {
          toast.error(responseData.errors.bio);
        } else {
          toast.error("Please check your profile information");
        }

        return;
      }

      /*
       * Multer file-size error.
       */
      if (error.response?.status === 413) {
        toast.error("Profile image is too large");
        return;
      }

      /*
       * Generic API error.
       */
      toast.error(
        responseData?.message || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (saving) return;

    navigate("/profile");
  };


  return (
    <div className="min-h-screen bg-[#F7F6F3] px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={saving}
            className="text-[#1B1C20] hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <h1 className="text-xl font-semibold text-[#1B1C20]">
              Edit Profile
            </h1>

            <p className="text-sm text-[#686A72]">
              Update your Nexo profile information
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E4E1DB] bg-white p-6 shadow-sm"
        >
          {/* Profile Image */}
          <div className="border-b border-[#EEECE8] pb-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[#1B1C20]">
                Profile photo
              </h2>

              <p className="mt-1 text-sm text-[#686A72]">
                Choose a profile picture for your Nexo account.
              </p>
            </div>

            <div className="flex items-center gap-5">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={previewUrl || undefined}
                  alt={user?.username || "Profile"}
                />

                <AvatarFallback className="bg-[#FFF0E8] text-xl font-semibold text-[#FF4D00]">
                  {user?.name?.charAt(0)?.toUpperCase() || "N"}
                </AvatarFallback>
              </Avatar>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={saving}
                />

                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-[#E4E1DB] text-[#1B1C20] hover:bg-[#F7F6F3]"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Change photo
                </Button>

                <p className="mt-2 text-xs text-[#9A9CA3]">
                  JPG, PNG, JPEG or WebP · Max 5 MB
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="name"
                className="text-sm font-medium text-[#1B1C20]"
              >
                Name
              </label>

              <span className="text-xs text-[#9A9CA3]">
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>

            <Input
              id="name"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              disabled={saving}
              placeholder="Your name"
              onChange={(event) => {
                setName(event.target.value);

                if (errors.name) {
                  setErrors((previous) => ({
                    ...previous,
                    name: "",
                  }));
                }
              }}
              className={`border-[#E4E1DB] bg-white text-[#1B1C20] placeholder:text-[#9A9CA3] focus-visible:ring-[#FF4D00] ${
                errors.name ? "border-[#D94B4B]" : ""
              }`}
            />

            {errors.name && (
              <p className="text-sm text-[#D94B4B]">
                {errors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="mt-5 space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-[#1B1C20]"
            >
              Username
            </label>

            <Input
              id="username"
              value={user?.username || ""}
              disabled
              className="border-[#E4E1DB] bg-[#F7F6F3] text-[#686A72]"
            />

            <p className="text-xs text-[#9A9CA3]">
              Username cannot be changed here.
            </p>
          </div>

          {/* Bio */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="bio"
                className="text-sm font-medium text-[#1B1C20]"
              >
                Bio
              </label>

              <span className="text-xs text-[#9A9CA3]">
                {bio.length}/{MAX_BIO_LENGTH}
              </span>
            </div>

            <Textarea
              id="bio"
              value={bio}
              maxLength={MAX_BIO_LENGTH}
              disabled={saving}
              placeholder="Tell people a little about yourself..."
              rows={4}
              onChange={(event) => {
                setBio(event.target.value);

                if (errors.bio) {
                  setErrors((previous) => ({
                    ...previous,
                    bio: "",
                  }));
                }
              }}
              className={`resize-none border-[#E4E1DB] bg-white text-[#1B1C20] placeholder:text-[#9A9CA3] focus-visible:ring-[#FF4D00] ${
                errors.bio ? "border-[#D94B4B]" : ""
              }`}
            />

            {errors.bio && (
              <p className="text-sm text-[#D94B4B]">
                {errors.bio}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#EEECE8] pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="border-[#E4E1DB] text-[#1B1C20] hover:bg-[#F7F6F3]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="bg-[#FF4D00] text-white hover:bg-[#D9430A]"
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

