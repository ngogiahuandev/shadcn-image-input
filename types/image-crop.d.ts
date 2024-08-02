export type FileWithPreview = FileWithPath & {
  preview: string;
};

export type Ratios = "1:1" | "16:9" | "round";
