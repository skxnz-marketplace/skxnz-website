"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  deleteProductImage,
  reorderProductImages,
  uploadProductImage,
} from "@/lib/catalog/upload-actions";

export type GalleryImage = {
  id: string;
  url: string;
};

type ProductGalleryManagerProps = {
  productId: string;
  initialImages: GalleryImage[];
  maxImages?: number;
};

export function ProductGalleryManager({
  productId,
  initialImages,
  maxImages = 8,
}: ProductGalleryManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (formData: FormData) => {
    startTransition(async () => {
      const result = await uploadProductImage(formData);
      if (result.ok) {
        setImages((current) => [...current, { id: result.imageId, url: result.url }]);
        setMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setMessage(result.message);
      }
    });
  };

  const handleDelete = (imageId: string) => {
    const previous = images;
    setImages((current) => current.filter((image) => image.id !== imageId));
    startTransition(async () => {
      const result = await deleteProductImage(imageId);
      if (!result.ok) {
        setImages(previous);
        setMessage(result.message);
      }
    });
  };

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const next = [...images];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setImages(next);

    startTransition(async () => {
      const result = await reorderProductImages(
        productId,
        next.map((image) => image.id),
      );
      if (!result.ok) {
        setImages(images);
        setMessage(result.message);
      }
    });
  };

  return (
    <Card className="section-border rounded-[32px] p-6 sm:p-8">
      <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
        Product Photos
      </p>
      <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
        {images.length}/{maxImages} images
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-silver">
        The first image is the product&apos;s main photo everywhere it appears.
        JPEG, PNG, or WebP, up to 5MB each.
      </p>

      <form
        action={handleUpload}
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="productId" value={productId} />
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="min-w-0 flex-1 text-sm text-silver file:mr-3 file:rounded-full file:border-0 file:bg-teal/15 file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.1em] file:text-teal"
        />
        <Button type="submit" disabled={isPending || images.length >= maxImages}>
          Upload
        </Button>
      </form>

      {message ? (
        <p className="mt-4 rounded-[16px] border border-[rgba(217,70,239,0.28)] bg-[rgba(217,70,239,0.10)] p-4 text-sm leading-6 text-pearl">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.03]"
          >
            <div className="relative aspect-square">
              <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-teal/90 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.1em] text-obsidian">
                  Main
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-1 p-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0 || isPending}
                  onClick={() => move(index, -1)}
                  className="rounded-full border border-white/[0.1] px-2 py-1 text-xs text-silver disabled:opacity-30"
                  aria-label="Move earlier"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={index === images.length - 1 || isPending}
                  onClick={() => move(index, 1)}
                  className="rounded-full border border-white/[0.1] px-2 py-1 text-xs text-silver disabled:opacity-30"
                  aria-label="Move later"
                >
                  →
                </button>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(image.id)}
                className="rounded-full border border-[rgba(217,70,239,0.3)] px-2 py-1 text-xs text-sangria"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 ? (
        <p className="mt-4 text-sm text-silver">No photos uploaded yet.</p>
      ) : null}
    </Card>
  );
}
