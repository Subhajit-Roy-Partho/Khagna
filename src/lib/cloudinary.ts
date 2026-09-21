import { v2 as cloudinary } from "cloudinary";

function config() {
  const cloud_name =
    process.env.cloudinaryCloudName || process.env.CLOUDINARY_CLOUD_NAME || "";
  const api_key =
    process.env.cloudinaryAPIkey || process.env.CLOUDINARY_API_KEY || "";
  const api_secret =
    process.env.cloudinaryAPIsecret || process.env.CLOUDINARY_API_SECRET || "";
  if (!cloud_name) throw new Error("Missing Cloudinary cloud name");
  cloudinary.config({ cloud_name, api_key, api_secret });
}

// Aggressively compressed upload: auto format+quality, strip metadata, limit size
export async function uploadAggressive(
  fileBuffer: Buffer,
  folder = "khagna"
): Promise<{ url: string; public_id: string }> {
  config();
  const b64 = `data:image/auto;base64,${fileBuffer.toString("base64")}`;
  const res = await cloudinary.uploader.upload(b64, {
    folder,
    resource_type: "image",
    // aggressive compression
    quality: "auto:low",
    fetch_format: "auto",
    flags: "strip_profile",
    transformation: [
      { width: 800, height: 800, crop: "limit" },
      { quality: "auto:low", fetch_format: "auto" },
    ],
  });
  return { url: res.secure_url, public_id: res.public_id };
}

// Build an aggressively compressed delivery URL from an existing public_id or URL
export function compressedUrl(
  publicIdOrUrl: string,
  width = 600
): string {
  if (!publicIdOrUrl) return "";
  // If already a cloudinary URL, inject transformation
  if (publicIdOrUrl.includes("cloudinary.com") && publicIdOrUrl.includes("/upload/")) {
    return publicIdOrUrl.replace(
      "/upload/",
      `/upload/w_${width},h_${width},c_limit,q_auto:low,f_auto,fl_strip_profile/`
    );
  }
  const cloud_name =
    process.env.cloudinaryCloudName ||
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  if (!cloud_name) return publicIdOrUrl;
  return `https://res.cloudinary.com/${cloud_name}/image/upload/w_${width},h_${width},c_limit,q_auto:low,f_auto,fl_strip_profile/${publicIdOrUrl}`;
}

export { cloudinary };
