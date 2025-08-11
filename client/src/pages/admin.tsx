import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { insertProfileSchema, type InsertProfile, type Profile, type ProfileWithImages } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileFormSchema = insertProfileSchema.extend({
  tags: insertProfileSchema.shape.tags.optional(),
});

type ProfileFormData = {
  name: string;
  title: string;
  category: string;
  location?: string;
  description?: string;
  tags?: string[];
};

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState<ProfileWithImages | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      title: "",
      category: "",
      location: "",
      description: "",
      tags: [],
    },
  });

  const typedUser = user as any;

  // Redirect to home if not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !typedUser?.isAdmin)) {
      toast({
        title: "Access Denied",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      return;
    }
  }, [isAuthenticated, authLoading, typedUser, toast]);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<ProfileWithImages[]>({
    queryKey: ["/api/profiles"],
    enabled: isAuthenticated && typedUser?.isAdmin,
    queryFn: async () => {
      const response = await fetch('/api/profiles', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    }
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && typedUser?.isAdmin,
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await apiRequest("POST", "/api/profiles", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile created successfully",
      });
      form.reset();
      setUploadedImages([]);
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProfileFormData> }) => {
      const response = await apiRequest("PUT", `/api/profiles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setEditingProfile(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/profiles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProfileFormData) => {
    if (editingProfile) {
      updateProfileMutation.mutate({ id: editingProfile.id, data });
    } else {
      createProfileMutation.mutate(data);
    }
  };

  const handleEdit = (profile: ProfileWithImages) => {
    setEditingProfile(profile);
    form.reset({
      name: profile.name,
      title: profile.title,
      category: profile.category,
      location: profile.location || "",
      description: profile.description || "",
      tags: profile.tags || [],
    });
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
    form.reset();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Mock implementation - in real app, upload to cloud storage
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setUploadedImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-text mb-4" data-testid="text-access-denied">Access Denied</h1>
            <p className="text-gray-600" data-testid="text-admin-required">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-text font-poppins" data-testid="text-admin-title">
            Admin Dashboard
          </h1>
          <Badge variant="secondary" className="bg-primary text-white" data-testid="badge-admin">
            Admin Panel
          </Badge>
        </div>

        <Tabs defaultValue="profiles" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profiles" data-testid="tab-profiles">Profiles</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Profiles</p>
                      <p className="text-2xl font-bold text-primary" data-testid="stat-total-profiles">
                        {profiles.length}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-primary to-secondary rounded-full">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Profiles</p>
                      <p className="text-2xl font-bold text-secondary" data-testid="stat-active-profiles">
                        {profiles.filter(p => p.isActive).length}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-secondary to-accent rounded-full">
                      <Edit2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Images</p>
                      <p className="text-2xl font-bold text-accent" data-testid="stat-total-images">
                        {profiles.reduce((acc, p) => acc + (p.images?.length || 0), 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-accent to-primary rounded-full">
                      <Upload className="w-6 h-6 text-text" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Categories</p>
                      <p className="text-2xl font-bold text-text" data-testid="stat-categories">
                        {new Set(profiles.map(p => p.category)).size}
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-secondary to-primary rounded-full">
                      <Badge className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create/Edit Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-form-title">
                    {editingProfile ? "Edit Profile" : "Create New Profile"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter full name" 
                                {...field} 
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter job title" 
                                {...field} 
                                data-testid="input-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Technology">Technology</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Creative">Creative</SelectItem>
                                <SelectItem value="Consulting">Consulting</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter location" 
                                {...field} 
                                data-testid="input-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter profile description" 
                                {...field} 
                                data-testid="textarea-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Image Upload Section */}
                      <div className="space-y-4">
                        <FormLabel>Profile Images</FormLabel>
                        <div className="border-2 border-dashed border-secondary rounded-lg p-6 text-center">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                            data-testid="input-image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-secondary mx-auto mb-2" />
                            <p className="text-text font-medium mb-1">Upload Images</p>
                            <p className="text-gray-600 text-sm mb-2">Drag and drop or click to browse</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="border-secondary text-secondary hover:bg-secondary hover:text-white"
                              data-testid="button-browse-files"
                            >
                              Browse Files
                            </Button>
                          </label>
                        </div>

                        {/* Image Preview Grid */}
                        {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {uploadedImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={image} 
                                  alt={`Upload ${index + 1}`} 
                                  className="w-full h-20 object-cover rounded-lg"
                                  data-testid={`img-upload-${index}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`button-remove-image-${index}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-4 pt-4">
                        <Button
                          type="submit"
                          disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
                          className="bg-primary text-white hover:bg-primary/90"
                          data-testid="button-save-profile"
                        >
                          {createProfileMutation.isPending || updateProfileMutation.isPending 
                            ? "Saving..." 
                            : editingProfile ? "Update Profile" : "Create Profile"
                          }
                        </Button>
                        {editingProfile && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            data-testid="button-cancel-edit"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Existing Profiles List */}
              <Card>
                <CardHeader>
                  <CardTitle data-testid="text-existing-profiles-title">Existing Profiles</CardTitle>
                </CardHeader>
                <CardContent>
                  {profilesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-gray-200 rounded-lg h-16 animate-pulse" />
                      ))}
                    </div>
                  ) : profiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500" data-testid="text-no-profiles">
                      No profiles created yet
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto" data-testid="list-profiles">
                      {profiles.map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                          data-testid={`card-profile-${profile.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            {profile.images && profile.images.length > 0 ? (
                              <img
                                src={profile.images[0].imageUrl}
                                alt={profile.name}
                                className="w-10 h-10 rounded-full object-cover"
                                data-testid={`img-profile-${profile.id}`}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">
                                  {profile.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-text" data-testid={`text-profile-name-${profile.id}`}>
                                {profile.name}
                              </p>
                              <p className="text-sm text-gray-600" data-testid={`text-profile-title-${profile.id}`}>
                                {profile.title}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={profile.isActive ? "default" : "secondary"} 
                              className={profile.isActive ? "bg-green-100 text-green-800" : ""}
                              data-testid={`badge-status-${profile.id}`}
                            >
                              {profile.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(profile)}
                              data-testid={`button-edit-${profile.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteProfileMutation.mutate(profile.id)}
                              disabled={deleteProfileMutation.isPending}
                              className="text-red-500 hover:text-red-700"
                              data-testid={`button-delete-${profile.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
