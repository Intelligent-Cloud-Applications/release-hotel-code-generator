import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import { Label } from '../../../components/ui/label.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.js';
import { Badge } from '../../../components/ui/badge.js';
import { Separator } from '../../../components/ui/separator.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../../components/ui/dialog.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.js';
import { Checkbox } from '../../../components/ui/checkbox.js';
import { Textarea } from '../../../components/ui/textarea.js';
import { 
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  Bed,
  DollarSign,
  Users,
  MapPin,
  Tag,
  Clock,
  Shield,
  Database,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

const Lookups = () => {
  const [activeTab, setActiveTab] = useState('room-types');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for different lookup categories
  const [lookupData, setLookupData] = useState({
    roomTypes: [
      { id: '1', name: 'Standard', description: 'Basic room with essential amenities', basePrice: 2000, capacity: 2, status: 'active' },
      { id: '2', name: 'Deluxe', description: 'Comfortable room with additional amenities', basePrice: 3000, capacity: 2, status: 'active' },
      { id: '3', name: 'Suite', description: 'Spacious room with separate living area', basePrice: 5000, capacity: 4, status: 'active' },
      { id: '4', name: 'Premium', description: 'Luxury room with premium amenities', basePrice: 4000, capacity: 3, status: 'inactive' }
    ],
    ratePlans: [
      { id: 'RP1001', name: 'Rack Rate', description: 'Standard published rate', type: 'BAR', discount: 0, status: 'active' },
      { id: 'RP1002', name: 'Corporate Rate', description: 'Special rate for corporate clients', type: 'Corporate', discount: 15, status: 'active' },
      { id: 'RP1003', name: 'Weekend Special', description: 'Special weekend package rate', type: 'Package', discount: 20, status: 'active' },
      { id: 'RP1004', name: 'Group Rate', description: 'Discounted rate for group bookings', type: 'Group', discount: 25, status: 'inactive' }
    ],
    amenities: [
      { id: '1', name: 'WiFi', category: 'Technology', description: 'High-speed internet access', status: 'active' },
      { id: '2', name: 'Swimming Pool', category: 'Recreation', description: 'Outdoor swimming pool', status: 'active' },
      { id: '3', name: 'Gym', category: 'Fitness', description: '24/7 fitness center', status: 'active' },
      { id: '4', name: 'Spa', category: 'Wellness', description: 'Full-service spa', status: 'inactive' },
      { id: '5', name: 'Restaurant', category: 'Dining', description: 'On-site restaurant', status: 'active' }
    ],
    services: [
      { id: '1', name: 'Room Service', category: 'Food & Beverage', price: 50, unit: 'per order', status: 'active' },
      { id: '2', name: 'Laundry', category: 'Housekeeping', price: 100, unit: 'per kg', status: 'active' },
      { id: '3', name: 'Airport Transfer', category: 'Transportation', price: 500, unit: 'per trip', status: 'active' },
      { id: '4', name: 'Extra Bed', category: 'Room', price: 300, unit: 'per night', status: 'active' },
      { id: '5', name: 'Bar', category: 'Food & Beverage', price: 200, unit: 'per item', status: 'inactive' }
    ],
    staff: [
      { id: '123', name: 'John Manager', role: 'Manager', department: 'Front Desk', email: 'john@hotel.com', status: 'active' },
      { id: '456', name: 'Sarah Receptionist', role: 'Receptionist', department: 'Front Desk', email: 'sarah@hotel.com', status: 'active' },
      { id: '789', name: 'Mike Housekeeping', role: 'Supervisor', department: 'Housekeeping', email: 'mike@hotel.com', status: 'active' },
      { id: '12345', name: 'Lisa Admin', role: 'Administrator', department: 'Admin', email: 'lisa@hotel.com', status: 'inactive' }
    ],
    gstTypes: [
      { id: '1', name: 'CGST-SGST', rate: 18, description: 'Central + State GST (9% + 9%)', applicableStates: 'Same State', status: 'active' },
      { id: '2', name: 'IGST', rate: 18, description: 'Integrated GST (18%)', applicableStates: 'Interstate', status: 'active' },
      { id: '3', name: 'GST Exempt', rate: 0, description: 'No GST applicable', applicableStates: 'All', status: 'active' }
    ]
  });

  // Form data for adding/editing
  const [formData, setFormData] = useState({});

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get current tab data
  const getCurrentTabData = () => {
    const dataMap = {
      'room-types': lookupData.roomTypes,
      'rate-plans': lookupData.ratePlans,
      'amenities': lookupData.amenities,
      'services': lookupData.services,
      'staff': lookupData.staff,
      'gst-types': lookupData.gstTypes
    };
    return dataMap[activeTab] || [];
  };

  // Filter data based on search
  const getFilteredData = () => {
    const data = getCurrentTabData();
    if (!searchTerm) return data;
    
    return data.filter(item => 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // Add new item
  const handleAdd = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newId = Date.now().toString();
      const newItem = { ...formData, id: newId, status: 'active' };
      
      // Update the appropriate data array
      const dataKey = {
        'room-types': 'roomTypes',
        'rate-plans': 'ratePlans',
        'amenities': 'amenities',
        'services': 'services',
        'staff': 'staff',
        'gst-types': 'gstTypes'
      }[activeTab];
      
      setLookupData(prev => ({
        ...prev,
        [dataKey]: [...prev[dataKey], newItem]
      }));
      
      setShowAddDialog(false);
      setFormData({});
      toast.success('Item added successfully!');
    } catch (error) {
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  // Edit item
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
  };

  // Save edited item
  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataKey = {
        'room-types': 'roomTypes',
        'rate-plans': 'ratePlans',
        'amenities': 'amenities',
        'services': 'services',
        'staff': 'staff',
        'gst-types': 'gstTypes'
      }[activeTab];
      
      setLookupData(prev => ({
        ...prev,
        [dataKey]: prev[dataKey].map(item => 
          item.id === editingItem.id ? { ...formData } : item
        )
      }));
      
      setEditingItem(null);
      setFormData({});
      toast.success('Item updated successfully!');
    } catch (error) {
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDelete = async (itemId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataKey = {
        'room-types': 'roomTypes',
        'rate-plans': 'ratePlans',
        'amenities': 'amenities',
        'services': 'services',
        'staff': 'staff',
        'gst-types': 'gstTypes'
      }[activeTab];
      
      setLookupData(prev => ({
        ...prev,
        [dataKey]: prev[dataKey].filter(item => item.id !== itemId)
      }));
      
      toast.success('Item deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  // Toggle status
  const toggleStatus = async (item) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const dataKey = {
        'room-types': 'roomTypes',
        'rate-plans': 'ratePlans',
        'amenities': 'amenities',
        'services': 'services',
        'staff': 'staff',
        'gst-types': 'gstTypes'
      }[activeTab];
      
      setLookupData(prev => ({
        ...prev,
        [dataKey]: prev[dataKey].map(dataItem => 
          dataItem.id === item.id ? { ...dataItem, status: newStatus } : dataItem
        )
      }));
      
      toast.success(`Item ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Get form fields for current tab
  const getFormFields = () => {
    const fieldMap = {
      'room-types': [
        { name: 'name', label: 'Room Type Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'basePrice', label: 'Base Price', type: 'number', required: true },
        { name: 'capacity', label: 'Capacity', type: 'number', required: true }
      ],
      'rate-plans': [
        { name: 'id', label: 'Rate Plan ID', type: 'text', required: true },
        { name: 'name', label: 'Plan Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'type', label: 'Type', type: 'select', options: ['BAR', 'Corporate', 'Package', 'Group'], required: true },
        { name: 'discount', label: 'Discount (%)', type: 'number', required: true }
      ],
      'amenities': [
        { name: 'name', label: 'Amenity Name', type: 'text', required: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Technology', 'Recreation', 'Fitness', 'Wellness', 'Dining'], required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true }
      ],
      'services': [
        { name: 'name', label: 'Service Name', type: 'text', required: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Food & Beverage', 'Housekeeping', 'Transportation', 'Room'], required: true },
        { name: 'price', label: 'Price', type: 'number', required: true },
        { name: 'unit', label: 'Unit', type: 'text', required: true }
      ],
      'staff': [
        { name: 'id', label: 'Staff ID', type: 'text', required: true },
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'role', label: 'Role', type: 'select', options: ['Manager', 'Receptionist', 'Supervisor', 'Administrator'], required: true },
        { name: 'department', label: 'Department', type: 'select', options: ['Front Desk', 'Housekeeping', 'Admin', 'Security'], required: true },
        { name: 'email', label: 'Email', type: 'email', required: true }
      ],
      'gst-types': [
        { name: 'name', label: 'GST Type Name', type: 'text', required: true },
        { name: 'rate', label: 'GST Rate (%)', type: 'number', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'applicableStates', label: 'Applicable For', type: 'select', options: ['Same State', 'Interstate', 'All'], required: true }
      ]
    };
    return fieldMap[activeTab] || [];
  };

  const tabConfig = [
    { id: 'room-types', label: 'Room Types', icon: Bed, count: lookupData.roomTypes.length },
    { id: 'rate-plans', label: 'Rate Plans', icon: DollarSign, count: lookupData.ratePlans.length },
    { id: 'amenities', label: 'Amenities', icon: Settings, count: lookupData.amenities.length },
    { id: 'services', label: 'Services', icon: Tag, count: lookupData.services.length },
    { id: 'staff', label: 'Staff', icon: Users, count: lookupData.staff.length },
    { id: 'gst-types', label: 'GST Types', icon: Shield, count: lookupData.gstTypes.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lookups & Master Data</h1>
        <p className="text-gray-600">Manage hotel configuration data and settings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          return (
            <Card key={tab.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => setActiveTab(tab.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Icon className={`h-6 w-6 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'}`} />
                  <Badge variant={activeTab === tab.id ? 'default' : 'secondary'}>
                    {tab.count}
                  </Badge>
                </div>
                <h3 className="font-medium text-sm mt-2">{tab.label}</h3>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {tabConfig.find(tab => tab.id === activeTab)?.label || 'Lookup Data'}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setFormData({})}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New {tabConfig.find(tab => tab.id === activeTab)?.label.slice(0, -1)}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {getFormFields().map((field) => (
                      <div key={field.name}>
                        <Label className="text-sm font-medium text-gray-700">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        ) : field.type === 'select' ? (
                          <Select value={formData[field.name] || ''} onValueChange={(value) => handleInputChange(field.name, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={loading}>
                      {loading ? 'Adding...' : 'Add'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === 'room-types' && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </>
                  )}
                  {activeTab === 'rate-plans' && (
                    <>
                      <TableHead>Plan ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </>
                  )}
                  {activeTab === 'amenities' && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </>
                  )}
                  {activeTab === 'services' && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </>
                  )}
                  {activeTab === 'staff' && (
                    <>
                      <TableHead>Staff ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </>
                  )}
                  {activeTab === 'gst-types' && (
                    <>
                      <TableHead>Name</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Applicable For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredData().map((item) => (
                  <TableRow key={item.id}>
                    {editingItem?.id === item.id ? (
                      // Edit row
                      <>
                        {getFormFields().map((field) => (
                          <TableCell key={field.name}>
                            {field.type === 'select' ? (
                              <Select value={formData[field.name] || ''} onValueChange={(value) => handleInputChange(field.name, value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map((option) => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={field.type}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                                className="h-8"
                              />
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                            {formData.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      // Display row
                      <>
                        {activeTab === 'room-types' && (
                          <>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                            <TableCell>{formatCurrency(item.basePrice)}</TableCell>
                            <TableCell>{item.capacity} guests</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'active' ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleStatus(item)}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === 'rate-plans' && (
                          <>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.type}</Badge>
                            </TableCell>
                            <TableCell>{item.discount}%</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'active' ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleStatus(item)}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === 'amenities' && (
                          <>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'active' ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleStatus(item)}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === 'services' && (
                          <>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'active' ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleStatus(item)}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === 'staff' && (
                          <>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.role}</Badge>
                            </TableCell>
                            <TableCell>{item.department}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'active' ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleStatus(item)}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        {activeTab === 'gst-types' && (
                          <>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.rate}%</TableCell>
                            <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                            <TableCell>{item.applicableStates}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'active' ? 'default' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleStatus(item)}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {getFilteredData().length === 0 && (
            <div className="text-center py-8">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Data Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No items match your search criteria' : 'No items available in this category'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Lookups;