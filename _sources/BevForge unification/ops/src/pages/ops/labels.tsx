import { useState } from 'react';
import { FileText, Plus, Search, Filter, Upload, Download, CheckCircle, Clock, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';


interface LabelSubmission {
  id: string;
  colaNumber?: string;
  productName: string;
  brandName: string;
  productType: string;
  abv: number;
  submissionDate: string;
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'revision-required';
  ttbStatus?: string;
  approvalDate?: string;
  expirationDate?: string;
  labelDesignUrl?: string;
  notes?: string;
  revisionNotes?: string;
}

export default function LabelsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Mock data
  const labels: LabelSubmission[] = [
    {
      id: '1',
      colaNumber: 'COLA-2024-001234',
      productName: 'Hoppy Trail IPA',
      brandName: 'BevForge Brewing',
      productType: 'Beer - IPA',
      abv: 6.5,
      submissionDate: '2024-10-15',
      status: 'approved',
      ttbStatus: 'Approved',
      approvalDate: '2024-11-20',
      expirationDate: '2027-11-20',
      labelDesignUrl: '/labels/hoppy-trail-ipa.pdf',
      notes: 'Standard IPA label approval',
    },
    {
      id: '2',
      colaNumber: 'COLA-2024-001567',
      productName: 'Golden Sunset Lager',
      brandName: 'BevForge Brewing',
      productType: 'Beer - Lager',
      abv: 4.8,
      submissionDate: '2024-11-01',
      status: 'under-review',
      ttbStatus: 'Pending Review',
      labelDesignUrl: '/labels/golden-sunset-lager.pdf',
      notes: 'Awaiting TTB review',
    },
    {
      id: '3',
      productName: 'Midnight Stout',
      brandName: 'BevForge Brewing',
      productType: 'Beer - Stout',
      abv: 8.2,
      submissionDate: '2024-12-01',
      status: 'revision-required',
      ttbStatus: 'Revision Requested',
      labelDesignUrl: '/labels/midnight-stout.pdf',
      notes: 'Initial submission',
      revisionNotes: 'Health warning statement font size needs to be increased to meet minimum requirements',
    },
    {
      id: '4',
      productName: 'Citrus Burst Seltzer',
      brandName: 'BevForge Brewing',
      productType: 'Hard Seltzer',
      abv: 5.0,
      submissionDate: '2024-12-10',
      status: 'submitted',
      ttbStatus: 'Submitted',
      labelDesignUrl: '/labels/citrus-burst-seltzer.pdf',
      notes: 'New product line submission',
    },
    {
      id: '5',
      productName: 'Barrel-Aged Reserve',
      brandName: 'BevForge Brewing',
      productType: 'Beer - Barrel-Aged',
      abv: 10.5,
      submissionDate: '2024-12-15',
      status: 'draft',
      labelDesignUrl: '/labels/barrel-aged-reserve-draft.pdf',
      notes: 'Limited edition release - draft in progress',
    },
  ];

  const filteredLabels = labels.filter((label) => {
    const matchesSearch =
      label.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      label.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (label.colaNumber && label.colaNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || label.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'submitted':
      case 'under-review':
        return 'bg-blue-500';
      case 'revision-required':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'submitted':
      case 'under-review':
        return <Clock className="h-4 w-4" />;
      case 'revision-required':
        return <AlertCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const approvedCount = labels.filter((l) => l.status === 'approved').length;
  const pendingCount = labels.filter((l) => ['submitted', 'under-review'].includes(l.status)).length;
  const revisionCount = labels.filter((l) => l.status === 'revision-required').length;
  const draftCount = labels.filter((l) => l.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Label Approvals</h1>
          <p className="text-muted-foreground">Manage TTB COLA submissions and approvals</p>
        </div>
        <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Submit Label
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Label for Approval</DialogTitle>
              <DialogDescription>Submit a new label design to TTB for COLA approval</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input id="productName" placeholder="Hoppy Trail IPA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input id="brandName" placeholder="BevForge Brewing" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select>
                    <SelectTrigger id="productType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beer-ipa">Beer - IPA</SelectItem>
                      <SelectItem value="beer-lager">Beer - Lager</SelectItem>
                      <SelectItem value="beer-stout">Beer - Stout</SelectItem>
                      <SelectItem value="beer-ale">Beer - Ale</SelectItem>
                      <SelectItem value="seltzer">Hard Seltzer</SelectItem>
                      <SelectItem value="cider">Cider</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                      <SelectItem value="spirits">Spirits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abv">ABV (%)</Label>
                  <Input id="abv" type="number" step="0.1" placeholder="6.5" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="labelDesign">Label Design File</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, PNG, or JPG (max 10MB)</p>
                  <Input id="labelDesign" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Submission Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or special instructions for this submission..."
                  rows={3}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">TTB Requirements Checklist:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Brand name clearly visible</li>
                  <li>✓ Class and type designation included</li>
                  <li>✓ Alcohol content (ABV) displayed</li>
                  <li>✓ Health warning statement present</li>
                  <li>✓ Net contents shown</li>
                  <li>✓ Name and address of bottler/importer</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline">Save as Draft</Button>
                <Button onClick={() => setIsSubmitDialogOpen(false)}>Submit to TTB</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Active COLAs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting TTB</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisions Needed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{revisionCount}</div>
            <p className="text-xs text-muted-foreground">Action required</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search labels, products, or COLA numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="revision-required">Revision Required</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Label Submissions</CardTitle>
          <CardDescription>Track TTB COLA submissions and approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>COLA Number</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>ABV</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TTB Status</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLabels.map((label) => (
                <TableRow key={label.id}>
                  <TableCell className="font-medium">
                    {label.colaNumber || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{label.productName}</div>
                      <div className="text-sm text-muted-foreground">{label.brandName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{label.productType}</TableCell>
                  <TableCell>{label.abv}%</TableCell>
                  <TableCell>{new Date(label.submissionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(label.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(label.status)}
                      {label.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {label.ttbStatus || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {label.expirationDate ? (
                      new Date(label.expirationDate).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" title="View label">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revision Notes Section */}
      {filteredLabels.some((l) => l.revisionNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Revision Requests</CardTitle>
            <CardDescription>Labels requiring updates before resubmission</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredLabels
              .filter((l) => l.revisionNotes)
              .map((label) => (
                <div key={label.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{label.productName}</h4>
                      <p className="text-sm text-muted-foreground">{label.colaNumber || 'No COLA number'}</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Revision Required
                    </Badge>
                  </div>
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="font-medium mb-1">TTB Feedback:</p>
                    <p className="text-muted-foreground">{label.revisionNotes}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Revised Label
                    </Button>
                    <Button size="sm">Resubmit to TTB</Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
