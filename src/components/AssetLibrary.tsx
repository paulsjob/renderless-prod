import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Trash2 } from 'lucide-react';

type AssetLibraryProps = {
  onAssetSelect: (url: string) => void;
};

type AssetItem = {
  name: string;
  url: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const AssetLibrary = ({ onAssetSelect }: AssetLibraryProps) => {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canUseStorage = useMemo(() => Boolean(supabaseClient), []);

  const fetchAssets = async () => {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient.storage.from('assets').list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      setStatus(error.message);
      return;
    }
    const nextAssets =
      data?.map((item) => {
        const { data: urlData } = supabaseClient.storage.from('assets').getPublicUrl(item.name);
        return { name: item.name, url: urlData.publicUrl };
      }) ?? [];
    setAssets(nextAssets);
  };

  useEffect(() => {
    void fetchAssets();
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    if (!supabaseClient) {
      setStatus('Supabase is not configured for uploads.');
      return;
    }
    setStatus('Uploading...');
    const uploads = Array.from(files).map(async (file) => {
      const filePath = `${Date.now()}-${file.name}`;
      const { error } = await supabaseClient.storage.from('assets').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) {
        throw error;
      }
    });
    try {
      await Promise.all(uploads);
      setStatus('Upload complete.');
      await fetchAssets();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      setStatus(message);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) {
      await uploadFiles(event.dataTransfer.files);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      await uploadFiles(event.target.files);
    }
    event.target.value = '';
  };

  const handleDelete = async (assetName: string) => {
    if (!supabaseClient) {
      setStatus('Supabase is not configured for deletes.');
      return;
    }
    setStatus('Removing asset...');
    const { error } = await supabaseClient.storage.from('assets').remove([assetName]);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus('Asset removed.');
    await fetchAssets();
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div
        className={`rounded-xl border border-dashed px-4 py-6 text-center text-xs transition ${
          isDragging ? 'border-sky-500 bg-sky-500/10 text-white' : 'border-[#2a3346] text-zinc-400'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <p className="text-sm font-semibold text-zinc-200">Drag files here or Click to Upload</p>
        <p className="mt-2 text-[11px] text-zinc-500">
          {canUseStorage ? 'Upload PNG, JPG, or SVG files.' : 'Supabase not configured.'}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1 text-[11px] text-zinc-200 hover:border-sky-500 hover:text-white"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canUseStorage}
        >
          Browse Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {status && <p className="mt-3 text-[11px] text-zinc-400">{status}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {assets.map((asset) => (
          <button
            key={asset.name}
            type="button"
            className="group flex flex-col overflow-hidden rounded-lg border border-[#1f2636] bg-[#141a28] text-left hover:border-sky-500"
            onClick={() => onAssetSelect(asset.url)}
          >
            <div className="relative h-24 w-full overflow-hidden bg-zinc-900">
              <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDelete(asset.name);
                }}
                className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-zinc-200 opacity-0 transition group-hover:opacity-100 hover:text-white"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="px-2 py-2 text-[11px] text-zinc-400 group-hover:text-white">
              {asset.name}
            </div>
          </button>
        ))}
        {!assets.length && (
          <div className="col-span-2 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 p-4 text-center text-[11px] text-zinc-500">
            No assets uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
};
