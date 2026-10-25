const DEFAULT_TRANSFORMATIONS = "f_auto,q_auto";

const formatTransformations = (transformations) => {
  if (!transformations) {
    return DEFAULT_TRANSFORMATIONS;
  }

  const requested =
    typeof transformations === "string"
      ? transformations.split(",")
      : Object.entries(transformations).map(
          ([key, value]) => `${key}_${value}`
        );
  const hasFormat = requested.some((item) => item.startsWith("f_"));
  const hasQuality = requested.some((item) => item.startsWith("q_"));

  if (!hasFormat) {
    requested.unshift("f_auto");
  }
  if (!hasQuality) {
    requested.push("q_auto");
  }
  return requested.join(",");
};

export const getCloudinaryUrl = (
  publicId,
  transformations = DEFAULT_TRANSFORMATIONS
) => {
  if (!publicId) {
    return "";
  }

  const transformationString = formatTransformations(transformations);
  const cloudinaryUploadPath = /\/image\/upload\//;

  if (publicId.includes("res.cloudinary.com") && cloudinaryUploadPath.test(publicId)) {
    const [baseUrl, ...pathParts] = publicId.split("/image/upload/");
    const assetPath = pathParts.join("/image/upload/");
    const hasAutoFormat = /(^|\/|,)f_auto(,|\/|$)/.test(assetPath);
    const hasAutoQuality = /(^|\/|,)q_auto(,|\/|$)/.test(assetPath);
    const requested = transformationString
      .split(",")
      .filter((item) => {
        if (item === "f_auto" && hasAutoFormat) {
          return false;
        }
        if (item === "q_auto" && hasAutoQuality) {
          return false;
        }
        return true;
      });
    const prefix = requested.length ? `${requested.join(",")}/` : "";

    return `${baseUrl}/image/upload/${prefix}${assetPath}`;
  }

  if (/^https?:\/\//i.test(publicId)) {
    return publicId;
  }

  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return publicId;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}/${publicId}`;
};
