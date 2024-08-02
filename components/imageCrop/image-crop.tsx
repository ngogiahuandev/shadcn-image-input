"use client";

import { useCallback, useRef, useState, type SyntheticEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";

import "react-image-crop/dist/ReactCrop.css";

import { cn } from "@/lib/utils";
import { FileWithPreview, Ratios } from "@/types/image-crop";
import { BanIcon, CropIcon, UploadIcon } from "lucide-react";
import Image from "next/image";
import { FileWithPath, useDropzone } from "react-dropzone";

const accept = {
  "image/*": [],
};

interface ImageCropperProps {
  ratio: Ratios;
  setFinalImage: (image: File) => void;
}

export function ImageCropper({
  ratio = "1:1",
  setFinalImage,
}: ImageCropperProps) {
  const aspect = getAspectRatio(ratio);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>("");
  const [croppedImage, setCroppedImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(
    null
  );
  const [isDialogOpen, setDialogOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      alert("Selected image is too large!");
      return;
    }

    const fileWithPreview = Object.assign(file, {
      preview: URL.createObjectURL(file),
    });

    setSelectedFile(fileWithPreview);
    setDialogOpen(true);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
  });

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  function onCropComplete(crop: PixelCrop) {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imgRef.current, crop);
      setCroppedImageUrl(croppedImageUrl);
    }
  }

  function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): string {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );
    }

    return canvas.toDataURL("image/png", 1.0);
  }

  async function onCrop() {
    try {
      setCroppedImage(croppedImageUrl);
      const blob = await fetch(croppedImageUrl).then((r) => r.blob());
      const file = new File([blob], "cropped-image.png", {
        type: "image/png",
      });
      setFinalImage(file);
      setDialogOpen(false);
    } catch (error) {
      alert("Something went wrong!");
    }
  }

  return (
    <div className="size-full">
      <Dialog open={isDialogOpen}>
        {selectedFile ? (
          <div
            className={cn(
              "hover:cursor-pointer rounded w-full h-full overflow-hidden outline-offset-2 outline-gray-300 outline hover:outline-gray-400",
              getAspectRatioClass(ratio)
            )}
          >
            <DialogTrigger asChild>
              <Image
                src={croppedImage ? croppedImage : selectedFile?.preview}
                alt="Selected Image"
                width={1000}
                height={1000}
                className={cn("size-full", getAspectRatioClass(ratio))}
              />
            </DialogTrigger>
          </div>
        ) : (
          <div
            className={cn(
              "bg-gray-100 p-5 rounded w-full h-full flex items-center justify-center outline-dashed outline-gray-300 outline-offset-2",
              getAspectRatioClass(ratio)
            )}
            {...getRootProps()}
          >
            <div className="select-none text-gray-400 flex items-center gap-4 flex-col">
              <UploadIcon className={cn("size-8")} />
              <p className="text-center">Drag and drop or click here</p>
            </div>
            <input {...getInputProps()} />
          </div>
        )}

        <DialogContent className="p-0 gap-0">
          <div className="p-6 size-full">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => onCropComplete(c)}
              aspect={aspect}
              className="w-full"
            >
              <div>
                <Image
                  ref={imgRef}
                  className="rounded-none"
                  alt="Image Cropper Shell"
                  src={selectedFile?.preview}
                  onLoad={onImageLoad}
                  width={1000}
                  height={1000}
                />
              </div>
            </ReactCrop>
          </div>
          <div className="w-full flex gap-4 items-center justify-end p-6 pt-0">
            <Button
              size={"sm"}
              type="reset"
              className="w-fit"
              variant={"outline"}
              onClick={() => {
                setDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              <BanIcon className="mr-1.5 size-4" />
              Delete
            </Button>
            <Button
              type="submit"
              size={"sm"}
              className="w-fit"
              onClick={onCrop}
            >
              <CropIcon className="mr-1.5 size-4 aspect-square" />
              Crop
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to center the crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 100,
        height: 100,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

//get tailwind class base on aspect ratio
function getAspectRatioClass(ratio: Ratios): string {
  switch (ratio) {
    case "16:9":
      return "aspect-video";
    case "1:1":
      return "aspect-square";
    case "round":
      return "aspect-square rounded-full";
    default:
      return "aspect-square";
  }
}

function getAspectRatio(ratio: Ratios): number {
  switch (ratio) {
    case "1:1":
      return 1;
    case "16:9":
      return 16 / 9;
    case "round":
      return 1;
    default:
      return 1;
  }
}
