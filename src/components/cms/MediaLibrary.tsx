'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Search,
  X,
  Check,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Folder,
  Video,
  FileIcon,
} from 'lucide-react';
import {
  useMedia,
  useBatchDeleteMedia,
  useUploadMedia,
  useUpdateMedia,
} from '@/hooks/use-media';
import { usePortfolios } from '@/hooks/use-portfolios';
import { usePortfolio } from '@/providers/PortfolioProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BrutalConfirm } from '@/components/ui/BrutalConfirm';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Media } from '@/types/cms';
import { MediaFolder } from '@/schemas/cms';
import { CopyButton } from '@/components/ui/CopyButton';
import { useDebounce } from '@/hooks/use-debounce';

interface MediaLibraryProps {
  onSelect?: (media: Media) => void;
  onSelectMultiple?: (media: Media[]) => void;
  allowSelection?: boolean;
  multiSelect?: boolean;
}

export function MediaLibrary({
  onSelect,
  onSelectMultiple,
  allowSelection = false,
  multiSelect = false,
}: MediaLibraryProps) {
  const { activePortfolio } = usePortfolio();
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data: response, isLoading } = useMedia(
    activePortfolio,
    activeFolder,
    debouncedSearch
  );
  const { success, error } = useToast();

  const batchDeleteMedia = useBatchDeleteMedia();
  const uploadMutation = useUploadMedia();
  const updateMutation = useUpdateMedia();

  const [selectedAssets, setSelectedAssets] = useState<Media[]>([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isUploading = uploadCount > 0;
  const lastSelected = selectedAssets[selectedAssets.length - 1] || null;

  // Clear selection when portfolio changes
  useEffect(() => {
    setSelectedAssets([]);
    setSearch('');
  }, [activePortfolio]);

  const media = response?.data || [];

  const isImage = (mimeType: string, filename: string) =>
    mimeType?.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some((ext) =>
      filename?.toLowerCase().endsWith(ext)
    );
  const isVideo = (mimeType: string, filename: string) =>
    mimeType?.startsWith('video/') ||
    ['.mp4', '.mov', '.avi', '.webm', '.m4v'].some((ext) =>
      filename?.toLowerCase().endsWith(ext)
    );

  const handleAssetClick = (asset: Media) => {
    if (multiSelect) {
      setSelectedAssets((prev) => {
        const isSelected = prev.find((a) => a._id === asset._id);
        if (isSelected) {
          return prev.filter((a) => a._id !== asset._id);
        }
        return [...prev, asset];
      });
    } else {
      setSelectedAssets([asset]);
    }
  };

  const [uploadPortfolio, setUploadPortfolio] = useState<string>('');
  const { data: portfolios } = usePortfolios();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const portfolioToUse = activePortfolio || uploadPortfolio;

    if (!files || !portfolioToUse) {
      if (!portfolioToUse) {
        error('PORTFOLIO REQUIRED', 'Please select a portfolio for upload.');
      }
      return;
    }

    setUploadCount(files.length);

    const uploads = Array.from(files).map((file) =>
      uploadMutation
        .mutateAsync({
          file,
          portfolio: portfolioToUse,
          folder:
            activeFolder !== 'all'
              ? (activeFolder as MediaFolder)
              : MediaFolder.UNORGANIZED,
        })
        .then(() => {
          setUploadCount((prev) => Math.max(0, prev - 1));
          success(`Uploaded: ${file.name}`);
        })
        .catch((err) => {
          setUploadCount((prev) => Math.max(0, prev - 1));
          error(`Failed: ${file.name}`);
          console.error(err);
        })
    );

    await Promise.allSettled(uploads);
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (selectedAssets.length === 0) return;

    const ids = selectedAssets.map((a) => a._id);
    batchDeleteMedia.mutate(ids, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        setSelectedAssets([]);
        success(`${ids.length} asset(s) deleted`);
      },
      onError: () => {
        error('Failed to delete assets');
      },
    });
  };

  return (
    <div className="flex h-[80vh] flex-col overflow-hidden border-4 border-border bg-card shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
      {/* Library Toolbar */}
      <div className="flex items-center justify-between border-b-4 border-border bg-secondary/50 p-4">
        <div className="flex max-w-md flex-1 items-center gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-none border-2 border-border pl-10 text-xs"
            />
          </div>
          {selectedAssets.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge
                variant="brutal"
                className="h-10 shrink-0 whitespace-nowrap px-4"
              >
                {selectedAssets.length} SELECTED
              </Badge>
              <Button
                variant="outline"
                className="h-10 px-3"
                onClick={() => setSelectedAssets([])}
                title="Deselect all"
              >
                <X className="mr-2 h-4 w-4" />
                DESELECT
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!activePortfolio && (
            <Select
              value={uploadPortfolio}
              onChange={(e) => setUploadPortfolio(e.target.value)}
              className="h-10 border-border bg-background px-3 py-0 text-[9px]"
            >
              <option value="" className="bg-black text-white">
                Target Portfolio...
              </option>
              {portfolios?.map((p) => (
                <option
                  key={p._id}
                  value={p._id}
                  className="bg-black text-white"
                >
                  {p.name}
                </option>
              ))}
            </Select>
          )}

          {selectedAssets.length > 0 && (
            <Button
              variant="destructive"
              className="h-10 px-4"
              onClick={() => setIsConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              DELETE ({selectedAssets.length})
            </Button>
          )}
          <Button
            variant="brutal"
            className="relative h-10 px-4"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isUploading ? `UPLOADING (${uploadCount})...` : 'UPLOAD ASSETS'}
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={isUploading}
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Folders Sidebar */}
        <div className="flex w-48 shrink-0 flex-col border-r-4 border-border bg-secondary/10">
          <div className="border-b-2 border-border/50 p-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Library Folders
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {[
              { id: 'all', name: 'All Assets', icon: ImageIcon },
              ...Object.values(MediaFolder).map((folder) => ({
                id: folder,
                name: folder.toUpperCase(),
                icon: Folder,
              })),
            ].map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-l-4 px-4 py-3 text-[10px] font-bold uppercase transition-all',
                  activeFolder === folder.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent hover:bg-secondary/20'
                )}
              >
                <folder.icon className="h-4 w-4" />
                {folder.name}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="scrollbar-thin scrollbar-thumb-border flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center opacity-30">
              <ImageIcon className="mb-4 h-16 w-16" />
              <p className="font-bold uppercase tracking-widest">
                No assets found
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4',
                lastSelected
                  ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
              )}
            >
              {media.map((asset) => {
                const isSelected = selectedAssets.find(
                  (a) => a._id === asset._id
                );
                return (
                  <div
                    key={asset._id}
                    onClick={() => handleAssetClick(asset)}
                    className={cn(
                      'group relative aspect-square cursor-pointer border-2 transition-all',
                      isSelected
                        ? 'scale-95 border-primary ring-4 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {isImage(asset.mimeType, asset.filename) ? (
                      <Image
                        src={asset.imageKitUrl}
                        alt={asset.altText || asset.filename}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                        priority={media.indexOf(asset) < 4}
                      />
                    ) : isVideo(asset.mimeType, asset.filename) ? (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-secondary/20">
                        <Video className="mb-2 h-8 w-8 text-primary" />
                        <span className="text-[8px] font-bold">VIDEO</span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-secondary/20">
                        <FileIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                        <span className="text-[8px] font-bold">DOCUMENT</span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute right-1 top-1 z-10 bg-primary p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Sidebar (WordPress style) */}
        {lastSelected && (
          <div className="animate-in slide-in-from-right w-80 shrink-0 overflow-y-auto border-l-4 border-border bg-secondary/20 duration-200">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-border bg-background/95 p-4 backdrop-blur-sm">
              <h3 className="text-sm font-black uppercase tracking-tighter">
                Asset Details
              </h3>
              <button
                onClick={() => setSelectedAssets([])}
                className="hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="relative aspect-video border-2 border-border bg-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {isImage(lastSelected.mimeType, lastSelected.filename) ? (
                  <Image
                    src={lastSelected.imageKitUrl}
                    alt={lastSelected.altText || lastSelected.filename}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                ) : isVideo(lastSelected.mimeType, lastSelected.filename) ? (
                  <video
                    src={lastSelected.imageKitUrl}
                    controls
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <FileIcon className="h-12 w-12 text-muted-foreground" />
                    <span className="mt-2 text-[10px] font-bold uppercase">
                      No Preview Available
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Filename
                  </label>
                  <p className="truncate text-xs font-bold">
                    {lastSelected.filename}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Dimensions
                    </label>
                    <p className="text-xs font-bold">
                      {lastSelected.width} × {lastSelected.height}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Size
                    </label>
                    <p className="text-xs font-bold">
                      {(lastSelected.filesize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Alt Text (Accessibility)
                  </label>
                  <Input
                    value={lastSelected.altText || ''}
                    onChange={(e) => {
                      const newAlt = e.target.value;
                      const updated = { ...lastSelected, altText: newAlt };
                      setSelectedAssets((prev) =>
                        prev.map((a) =>
                          a._id === lastSelected._id ? updated : a
                        )
                      );
                      updateMutation.mutate(
                        { id: lastSelected._id!, data: { altText: newAlt } },
                        { onSuccess: () => success('ALT TEXT UPDATED') }
                      );
                    }}
                    placeholder="Describe the image..."
                    className="mt-1 h-8 rounded-none border-2 border-border text-[10px]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Virtual Folder
                  </label>
                  <Select
                    value={lastSelected.folder || MediaFolder.UNORGANIZED}
                    onChange={(e) => {
                      const val = e.target.value as MediaFolder;
                      const updated = { ...lastSelected, folder: val };
                      setSelectedAssets((prev) =>
                        prev.map((a) =>
                          a._id === lastSelected._id ? updated : a
                        )
                      );
                      updateMutation.mutate(
                        { id: lastSelected._id!, data: { folder: val } },
                        { onSuccess: () => success('FOLDER UPDATED') }
                      );
                    }}
                    className="mt-1 h-8 border-2 border-border text-[10px]"
                  >
                    {Object.values(MediaFolder).map((folder) => (
                      <option key={folder} value={folder}>
                        {folder.toUpperCase()}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Tags (Comma Separated)
                  </label>
                  <Input
                    value={lastSelected.tags?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean);
                      const updated = { ...lastSelected, tags };
                      setSelectedAssets((prev) =>
                        prev.map((a) =>
                          a._id === lastSelected._id ? updated : a
                        )
                      );
                    }}
                    onBlur={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean);
                      updateMutation.mutate(
                        { id: lastSelected._id!, data: { tags } },
                        { onSuccess: () => success('TAGS UPDATED') }
                      );
                    }}
                    placeholder="logo, dark-mode, etc..."
                    className="mt-1 h-8 rounded-none border-2 border-border text-[10px]"
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <CopyButton
                    value={lastSelected.imageKitUrl}
                    showText
                    className="h-10 w-full justify-center border-2 border-border bg-secondary/50 font-bold hover:border-primary hover:bg-secondary"
                  />
                  <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 text-[10px]"
                    asChild
                  >
                    <a
                      href={lastSelected.imageKitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> VIEW FULL SIZE
                    </a>
                  </Button>
                </div>

                {allowSelection && (
                  <Button
                    className="mt-4 w-full py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    onClick={() => {
                      if (multiSelect && onSelectMultiple) {
                        onSelectMultiple(selectedAssets);
                      } else {
                        onSelect?.(lastSelected);
                      }
                    }}
                  >
                    {multiSelect
                      ? `SELECT ${selectedAssets.length} ASSETS`
                      : 'SELECT THIS ASSET'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <BrutalConfirm
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title={
          selectedAssets.length > 1
            ? `Delete ${selectedAssets.length} Assets?`
            : 'Delete Asset?'
        }
        message={`Are you sure you want to permanently delete ${selectedAssets.length > 1 ? 'these assets' : 'this asset'}? This action cannot be undone and will remove the file(s) from ImageKit.`}
        confirmText="DELETE PERMANENTLY"
        isLoading={batchDeleteMedia.isPending}
      />
    </div>
  );
}
