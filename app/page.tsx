"use client";

import { ImageCropper } from "@/components/imageCrop/image-crop";
import { useState } from "react";

export default function Page() {
  const [image, setImage] = useState<File>();

  return (
    <div className="relative flex items-center justify-center min-h-screen min-w-full">
      <div className="w-[500px]">
        <ImageCropper ratio="16:9" setFinalImage={setImage} />
      </div>
    </div>
  );
}
