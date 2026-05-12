
import { GarmentAnalysis } from "../../types";

// Helper to compress image base64
export const compressImage = async (base64: string, maxWidth = 1024, maxHeight = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed.split(',')[1]);
    };
    img.onerror = () => resolve(base64);
    img.src = `data:image/jpeg;base64,${base64}`;
  });
};

// Helper to fetch image from URL and convert to Base64
export const fetchImageBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return "";
    const blob = await response.blob();
    const originalBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });

    if (!originalBase64) return "";
    return await compressImage(originalBase64);
  } catch (error) {
    console.warn("Failed to fetch reference image", error);
    return "";
  }
};

// Helper: Get configuration based on numeric value (range bucket)
export const getRangeConfig = <T extends { max: number; prompt: any }>(value: number, config: T[]) => {
  // Sort by max value ascending to ensure we hit the first valid bucket
  const sorted = [...config].sort((a, b) => a.max - b.max);
  const found = sorted.find(c => value <= c.max);
  return found || sorted[sorted.length - 1]; // Fallback to last
};

/**
 * Creates a generic analysis object for Batch Mode to skip the manual analysis step.
 * Relies on the model's visual understanding during generation.
 */
export const createDummyAnalysis = (): GarmentAnalysis => {
    return {
        technicalDescription: "High-quality fashion garment. Focus on material texture, cut, and fit visible in the image.",
        fabricType: "High-end material",
        cutAndFit: "Professional fashion cut",
        originalStyleVibe: "Stylish",
        styleKeywords: ["fashion", "quality", "trend"],
        recommendedScenario: "Studio",
        productTitle: "Fashion Item",
        garmentLength: "midi" // Default safe middle ground, model will adjust visually
    };
};
