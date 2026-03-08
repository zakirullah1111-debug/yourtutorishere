import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Video,
  Upload,
  Link2,
  Play,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  Rocket,
  Save,
} from "lucide-react";

interface DemoVideoSectionProps {
  userId: string;
  initialData: {
    demo_video_type: string | null;
    demo_video_url: string | null;
    demo_video_title: string | null;
    demo_video_thumbnail: string | null;
    demo_video_duration: string | null;
    live_demo_enabled: boolean;
    live_demo_price: number | null;
  };
  isOptional?: boolean;
  onSaved?: () => void;
}

type InputMode = "upload" | "link" | null;
type LinkStatus = "idle" | "valid_youtube" | "valid_vimeo" | "invalid";

const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  const m = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  return m ? m[1] : null;
};

export function DemoVideoSection({ userId, initialData, isOptional, onSaved }: DemoVideoSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoType, setVideoType] = useState<string | null>(initialData.demo_video_type);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialData.demo_video_url);
  const [videoTitle, setVideoTitle] = useState(initialData.demo_video_title || "");
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(initialData.demo_video_thumbnail);
  const [videoDuration, setVideoDuration] = useState(initialData.demo_video_duration || "");
  const [liveDemoEnabled, setLiveDemoEnabled] = useState(initialData.live_demo_enabled);
  const [liveDemoPrice, setLiveDemoPrice] = useState(initialData.live_demo_price?.toString() || "");

  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("idle");
  const [linkThumbnail, setLinkThumbnail] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");

  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const hasVideo = !!videoUrl;

  const handleLinkChange = useCallback((url: string) => {
    setLinkUrl(url);
    if (!url.trim()) {
      setLinkStatus("idle");
      setLinkThumbnail(null);
      return;
    }
    const ytId = extractYoutubeId(url);
    if (ytId) {
      setLinkStatus("valid_youtube");
      setLinkThumbnail(`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`);
      return;
    }
    const vimeoId = extractVimeoId(url);
    if (vimeoId) {
      setLinkStatus("valid_vimeo");
      // Try fetching Vimeo thumbnail
      fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`)
        .then((r) => r.json())
        .then((d) => setLinkThumbnail(d.thumbnail_url || null))
        .catch(() => setLinkThumbnail(null));
      return;
    }
    setLinkStatus("invalid");
    setLinkThumbnail(null);
  }, []);

  const handleSaveLink = () => {
    if (linkStatus === "valid_youtube") {
      setVideoType("youtube");
      setVideoUrl(linkUrl);
      setVideoThumbnail(linkThumbnail);
      setInputMode(null);
    } else if (linkStatus === "valid_vimeo") {
      setVideoType("vimeo");
      setVideoUrl(linkUrl);
      setVideoThumbnail(linkThumbnail);
      setInputMode(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid format", description: "Please upload an MP4, MOV, or WebM file", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "File too large", description: "Video must be under 100MB. Try a YouTube/Vimeo link instead.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadFileName(file.name);
    setUploadProgress(0);

    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      // Simulate progress since supabase doesn't give upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 8, 90));
      }, 300);

      const { data, error } = await supabase.storage
        .from("demo-videos")
        .upload(path, file, { upsert: true });

      clearInterval(progressInterval);

      if (error) throw error;

      setUploadProgress(100);

      // Get URL - since bucket is private, we need a signed URL for playback
      // But for storage, we save the path
      const { data: urlData } = supabase.storage.from("demo-videos").getPublicUrl(data.path);

      setVideoType("upload");
      setVideoUrl(data.path); // Store path, generate signed URL on demand
      setVideoThumbnail(null);
      setInputMode(null);

      toast({ title: "✓ Video uploaded!" });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (videoType === "upload" && videoUrl) {
      await supabase.storage.from("demo-videos").remove([videoUrl]);
    }
    if (videoThumbnail && videoThumbnail.includes("demo-thumbnails")) {
      // Try removing custom thumbnail
      const path = videoThumbnail.split("demo-thumbnails/")[1];
      if (path) await supabase.storage.from("demo-thumbnails").remove([path]);
    }
    setVideoType(null);
    setVideoUrl(null);
    setVideoTitle("");
    setVideoThumbnail(null);
    setVideoDuration("");
    setRemoveDialogOpen(false);
  };

  const handleSave = async () => {
    if (hasVideo && !videoTitle.trim()) {
      toast({ title: "Video title required", description: "Please add a title for your demo video.", variant: "destructive" });
      return;
    }
    if (liveDemoEnabled && liveDemoPrice && (isNaN(Number(liveDemoPrice)) || Number(liveDemoPrice) < 0)) {
      toast({ title: "Invalid price", description: "Demo price must be 0 or a positive number.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("tutors")
        .update({
          demo_video_type: videoType,
          demo_video_url: videoUrl,
          demo_video_title: videoTitle || null,
          demo_video_thumbnail: videoThumbnail,
          demo_video_duration: videoDuration || null,
          live_demo_enabled: liveDemoEnabled,
          live_demo_price: liveDemoPrice ? Number(liveDemoPrice) : null,
        } as any)
        .eq("user_id", userId);

      if (error) throw error;
      toast({ title: "Demo settings saved ✓" });
      onSaved?.();
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getPreviewSrc = () => {
    if (videoType === "youtube") {
      const id = extractYoutubeId(videoUrl || "");
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    }
    if (videoType === "vimeo") {
      const id = extractVimeoId(videoUrl || "");
      return `https://player.vimeo.com/video/${id}?color=7C3AED&title=0&byline=0&portrait=0`;
    }
    return null;
  };

  const getSignedVideoUrl = async (): Promise<string | null> => {
    if (videoType !== "upload" || !videoUrl) return null;
    const { data } = await supabase.storage.from("demo-videos").createSignedUrl(videoUrl, 3600);
    return data?.signedUrl || null;
  };

  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const openPreview = async () => {
    if (videoType === "upload") {
      const url = await getSignedVideoUrl();
      setSignedUrl(url);
    }
    setPreviewOpen(true);
  };

  const thumbnailDisplay = videoThumbnail || (videoType === "youtube" ? `https://img.youtube.com/vi/${extractYoutubeId(videoUrl || "")}/hqdefault.jpg` : null);

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="w-5 h-5 text-primary" /> Demo Video
            {isOptional && <Badge variant="outline" className="text-xs font-normal">Optional</Badge>}
          </CardTitle>
          <CardDescription>
            Let students see your teaching style before booking. Tutors with demo videos receive significantly more student inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasVideo && !inputMode && (
            /* STATE A — No video */
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">No demo video added yet</p>
              <p className="text-xs text-muted-foreground mb-4">Add one to attract more students</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => setInputMode("upload")}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Video
                </Button>
                <Button variant="outline" onClick={() => setInputMode("link")}>
                  <Link2 className="w-4 h-4 mr-2" /> Paste Link
                </Button>
              </div>
            </div>
          )}

          {!hasVideo && inputMode && (
            /* Input panel with tabs */
            <div className="space-y-4">
              <div className="flex border-b border-border">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${inputMode === "upload" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setInputMode("upload")}
                >
                  <Upload className="w-4 h-4 inline mr-1.5" /> Upload Video
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${inputMode === "link" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setInputMode("link")}
                >
                  <Link2 className="w-4 h-4 inline mr-1.5" /> Paste Link
                </button>
              </div>

              {inputMode === "upload" && (
                <>
                  {uploading ? (
                    <div className="border rounded-xl p-6 space-y-3">
                      <p className="text-sm font-medium truncate">{uploadFileName}</p>
                      <Progress value={uploadProgress} className="h-2" />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
                        <Button variant="ghost" size="sm" onClick={() => setUploading(false)}>
                          <X className="w-3.5 h-3.5 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-primary"); }}
                      onDragLeave={(e) => { e.currentTarget.classList.remove("border-primary"); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-primary");
                        const file = e.dataTransfer.files[0];
                        if (file && fileInputRef.current) {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          fileInputRef.current.files = dt.files;
                          fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                      }}
                    >
                      <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">Drag your video here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-2">MP4, MOV or WebM · Max 100MB · Recommended 2–5 minutes</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </>
              )}

              {inputMode === "link" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>YouTube or Vimeo URL</Label>
                    <div className="relative">
                      <Input
                        value={linkUrl}
                        onChange={(e) => handleLinkChange(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {linkStatus === "valid_youtube" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {linkStatus === "valid_vimeo" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {linkStatus === "invalid" && <AlertCircle className="w-4 h-4 text-destructive" />}
                      </div>
                    </div>
                    {linkStatus === "valid_youtube" && <p className="text-xs text-green-600">✓ YouTube video detected</p>}
                    {linkStatus === "valid_vimeo" && <p className="text-xs text-green-600">✓ Vimeo video detected</p>}
                    {linkStatus === "invalid" && <p className="text-xs text-destructive">Please enter a valid YouTube or Vimeo URL</p>}
                  </div>

                  {linkThumbnail && (linkStatus === "valid_youtube" || linkStatus === "valid_vimeo") && (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img src={linkThumbnail} alt="Video preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                      <Badge className="absolute bottom-2 left-2 text-xs">
                        ▶ {linkStatus === "valid_youtube" ? "YouTube" : "Vimeo"}
                      </Badge>
                    </div>
                  )}

                  {(linkStatus === "valid_youtube" || linkStatus === "valid_vimeo") && (
                    <Button onClick={handleSaveLink} className="w-full">
                      <CheckCircle className="w-4 h-4 mr-2" /> Use This Video
                    </Button>
                  )}
                </div>
              )}

              <Button variant="ghost" size="sm" onClick={() => { setInputMode(null); setLinkUrl(""); setLinkStatus("idle"); }}>
                ← Cancel
              </Button>
            </div>
          )}

          {hasVideo && (
            /* STATE B — Video added */
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-border">
                {thumbnailDisplay ? (
                  <div className="relative aspect-video bg-muted">
                    <img src={thumbnailDisplay} alt="Video thumbnail" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center cursor-pointer hover:bg-primary transition-colors" onClick={openPreview}>
                        <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    <Badge className="absolute bottom-2 left-2 text-xs">
                      {videoType === "youtube" ? "▶ YouTube" : videoType === "vimeo" ? "▶ Vimeo" : "📤 Uploaded"}
                    </Badge>
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Video uploaded</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Video Title *</Label>
                  <Input
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value.slice(0, 80))}
                    placeholder="e.g. Watch me teach a Physics lesson"
                  />
                  <p className="text-xs text-muted-foreground">{videoTitle.length}/80</p>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="e.g. 4:30"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={openPreview}>
                  <Play className="w-4 h-4 mr-2" /> Preview Video
                </Button>
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setRemoveDialogOpen(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase 2 opt-in */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Also offer live 1-on-1 demo sessions</Label>
              <p className="text-xs text-muted-foreground mt-1">Students can book a real-time session with you</p>
            </div>
            <Switch checked={liveDemoEnabled} onCheckedChange={setLiveDemoEnabled} />
          </div>

          {liveDemoEnabled && (
            <div className="space-y-2">
              <Label>Demo session price (PKR)</Label>
              <Input
                type="number"
                value={liveDemoPrice}
                onChange={(e) => setLiveDemoPrice(e.target.value)}
                placeholder="Enter 0 for free demos"
                min={0}
              />
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex gap-2">
            <Rocket className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Live demo booking is coming soon</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Enable this now and you'll be among the first when the feature goes live!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full h-11" onClick={handleSave} disabled={saving || uploading}>
        {saving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" /> Save Demo Settings</>
        )}
      </Button>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden bg-black">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-white text-sm">{videoTitle || "Demo Video Preview"}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {videoType === "upload" && signedUrl && (
              <video controls preload="metadata" playsInline className="w-full h-full">
                <source src={signedUrl} />
                Your browser doesn't support video playback.
              </video>
            )}
            {videoType === "youtube" && (
              <iframe
                src={getPreviewSrc()!}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="no-referrer"
                title={videoTitle}
              />
            )}
            {videoType === "vimeo" && (
              <iframe
                src={getPreviewSrc()!}
                className="w-full h-full"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="no-referrer"
                title={videoTitle}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove demo video?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
