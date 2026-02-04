import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Video,
  Upload,
  Search,
  Download,
  Eye,
  Trash2,
  FolderOpen,
  Plus,
  BookOpen,
  FileImage,
  Link as LinkIcon,
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  type: "document" | "video" | "image" | "link";
  subject: string;
  description: string;
  size?: string;
  uploadedAt: string;
  downloads: number;
}

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const resources: Resource[] = [
    {
      id: "1",
      title: "Algebra Fundamentals - Complete Guide",
      type: "document",
      subject: "Mathematics",
      description: "Comprehensive guide covering basic to advanced algebra concepts",
      size: "2.4 MB",
      uploadedAt: "2026-01-15",
      downloads: 45,
    },
    {
      id: "2",
      title: "Newton's Laws Explained",
      type: "video",
      subject: "Physics",
      description: "Video lecture explaining all three laws of motion with examples",
      size: "156 MB",
      uploadedAt: "2026-01-20",
      downloads: 32,
    },
    {
      id: "3",
      title: "Periodic Table Reference Chart",
      type: "image",
      subject: "Chemistry",
      description: "High-resolution periodic table with element properties",
      size: "1.8 MB",
      uploadedAt: "2026-01-22",
      downloads: 67,
    },
    {
      id: "4",
      title: "Calculus Practice Problems",
      type: "document",
      subject: "Mathematics",
      description: "50+ solved calculus problems for board exam preparation",
      size: "3.2 MB",
      uploadedAt: "2026-01-25",
      downloads: 28,
    },
    {
      id: "5",
      title: "Khan Academy - Organic Chemistry",
      type: "link",
      subject: "Chemistry",
      description: "External link to Khan Academy's organic chemistry course",
      uploadedAt: "2026-01-28",
      downloads: 15,
    },
    {
      id: "6",
      title: "Electromagnetic Induction Notes",
      type: "document",
      subject: "Physics",
      description: "Detailed notes on Faraday's law and Lenz's law",
      size: "1.5 MB",
      uploadedAt: "2026-02-01",
      downloads: 22,
    },
  ];

  const subjects = [...new Set(resources.map((r) => r.subject))];

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || resource.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-8 h-8 text-blue-500" />;
      case "video":
        return <Video className="w-8 h-8 text-red-500" />;
      case "image":
        return <FileImage className="w-8 h-8 text-green-500" />;
      case "link":
        return <LinkIcon className="w-8 h-8 text-purple-500" />;
      default:
        return <FileText className="w-8 h-8" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "document":
        return <Badge className="bg-blue-500/10 text-blue-600">Document</Badge>;
      case "video":
        return <Badge className="bg-red-500/10 text-red-600">Video</Badge>;
      case "image":
        return <Badge className="bg-green-500/10 text-green-600">Image</Badge>;
      case "link":
        return <Badge className="bg-purple-500/10 text-purple-600">Link</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PK", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const stats = {
    totalResources: resources.length,
    documents: resources.filter((r) => r.type === "document").length,
    videos: resources.filter((r) => r.type === "video").length,
    totalDownloads: resources.reduce((acc, r) => acc + r.downloads, 0),
  };

  return (
    <DashboardLayout userType="tutor">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Teaching Resources</h1>
            <p className="text-muted-foreground">
              Manage and share study materials with your students
            </p>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Resource</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Enter resource title" />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Brief description of the resource" />
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to upload
                    </p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setShowUploadDialog(false)}>
                  Upload Resource
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Resources</p>
                  <p className="text-xl font-bold">{stats.totalResources}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-xl font-bold">{stats.documents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Video className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Videos</p>
                  <p className="text-xl font-bold">{stats.videos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Download className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                  <p className="text-xl font-bold">{stats.totalDownloads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-muted rounded-lg">{getTypeIcon(resource.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium truncate">{resource.title}</h3>
                      {getTypeBadge(resource.type)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{resource.subject}</span>
                      {resource.size && <span>{resource.size}</span>}
                      <span>{resource.downloads} downloads</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-xs text-muted-foreground">
                    Uploaded {formatDate(resource.uploadedAt)}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No resources found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Resource
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
