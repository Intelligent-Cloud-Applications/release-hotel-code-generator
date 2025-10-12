import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.js";
import { Button } from "./ui/button.js";
import { Input } from "./ui/input.js";
import { Label } from "./ui/label.js";
import { Trash2, Edit2, Plus } from "lucide-react";
import { Badge } from "./ui/badge.js";

const LinkManagementModal = ({
  isOpen,
  onClose,
  sectionTitle,
  links = [],
  onSaveLinks,
}) => {
  const [localLinks, setLocalLinks] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newLink, setNewLink] = useState({ name: "", url: "" });
  const [errors, setErrors] = useState({});

  // Initialize local links when modal opens or links change
  useEffect(() => {
    if (isOpen) {
      setLocalLinks([...links]);
      setEditingIndex(null);
      setNewLink({ name: "", url: "" });
      setErrors({});
    }
  }, [isOpen, links]);

  const validateLink = (link) => {
    const newErrors = {};
    
    if (!link.name.trim()) {
      newErrors.name = "Link name is required";
    }
    
    if (!link.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!link.url.startsWith("http") && !link.url.startsWith("#") && !link.url.startsWith("/")) {
      newErrors.url = "URL should start with http, # or /";
    }
    
    return newErrors;
  };

  const handleAddLink = () => {
    const validation = validateLink(newLink);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    
    setLocalLinks([...localLinks, { ...newLink }]);
    setNewLink({ name: "", url: "" });
    setErrors({});
  };

  const handleEditLink = (index) => {
    setEditingIndex(index);
    setNewLink({ ...localLinks[index] });
    setErrors({});
  };

  const handleUpdateLink = () => {
    const validation = validateLink(newLink);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    
    const updatedLinks = [...localLinks];
    updatedLinks[editingIndex] = { ...newLink };
    setLocalLinks(updatedLinks);
    setEditingIndex(null);
    setNewLink({ name: "", url: "" });
    setErrors({});
  };

  const handleDeleteLink = (index) => {
    const updatedLinks = localLinks.filter((_, i) => i !== index);
    setLocalLinks(updatedLinks);
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewLink({ name: "", url: "" });
    }
  };

  const handleSave = () => {
    onSaveLinks(localLinks);
    onClose();
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setNewLink({ name: "", url: "" });
    setErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Manage {sectionTitle} Links
          </DialogTitle>
          <DialogDescription>
            Add, edit, or remove links for the {sectionTitle.toLowerCase()} section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Links */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Current Links</Label>
            {localLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No links added yet. Add your first link below.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {localLinks.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{link.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {link.url}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLink(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLink(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Form */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <Label className="text-base font-semibold">
                {editingIndex !== null ? "Edit Link" : "Add New Link"}
              </Label>
              {editingIndex !== null && (
                <Badge variant="secondary">Editing #{editingIndex + 1}</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkName">Link Name</Label>
                <Input
                  id="linkName"
                  placeholder="e.g., Deluxe Room"
                  value={newLink.name}
                  onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <div className="text-sm text-destructive">{errors.name}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL</Label>
                <Input
                  id="linkUrl"
                  placeholder="e.g., /rooms/deluxe or https://example.com"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className={errors.url ? "border-destructive" : ""}
                />
                {errors.url && (
                  <div className="text-sm text-destructive">{errors.url}</div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {editingIndex !== null ? (
                <>
                  <Button onClick={handleUpdateLink} className="flex-1">
                    Update Link
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleAddLink} 
                  className="flex-1"
                  disabled={!newLink.name.trim() || !newLink.url.trim()}
                >
                  Add Link
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkManagementModal;