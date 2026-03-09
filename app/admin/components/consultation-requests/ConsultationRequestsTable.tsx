'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  Search, 
  Eye, 
  Check, 
  X, 
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock3,
  ListTodo,
  Info
} from 'lucide-react';
import { ConsultationBooking, TimeSlot } from '@/types/consultation';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Loader } from "@/components/ui/spinner";


const ConsultationRequestsTable = () => {
  const [requests, setRequests] = useState<ConsultationBooking[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ConsultationBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<ConsultationBooking | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'propose' | 'more-info' | 'cancel' | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedAlternativeSlots, setSelectedAlternativeSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // Fetch available slots for proposing alternatives
  const fetchAvailableSlots = async () => {
    try {
      setFetchingSlots(true);
      const response = await fetch('/api/consultation/slots?status=available');
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    } finally {
      setFetchingSlots(false);
    }
  };

  // Fetch requests from API
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/consultation');
      if (response.ok) {
        const data = await response.json();
        // Convert date strings to Date objects if they aren't already
        const formattedData = data.map((req: Partial<ConsultationBooking>) => {
          const typedReq: ConsultationBooking = {
            id: req.id || '',
            reference_id: req.reference_id || '',
            issue_category: req.issue_category || '',
            visa_category: req.visa_category || '',
            case_stage: req.case_stage || '',
            urgency: req.urgency || 'normal',
            preferred_language: req.preferred_language || '',
            full_name: req.full_name || '',
            email: req.email || '',
            whatsapp_phone: req.whatsapp_phone || '',
            embassy_consulate: req.embassy_consulate,
            case_summary: req.case_summary || '',
            attachments: req.attachments,
            selected_slot: new Date(req.selected_slot!),
            alternate_slots: req.alternate_slots,
            status: req.status || 'pending_approval',
            admin_notes: req.admin_notes,
            created_at: new Date(req.created_at!),
            updated_at: new Date(req.updated_at!),
            expires_at: req.expires_at ? new Date(req.expires_at) : undefined,
          };
          return typedReq;
        });
        setRequests(formattedData);
      } else {
        console.error('Failed to fetch consultation requests:', response.status, response.statusText);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching consultation requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = requests;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(request =>
        request.full_name.toLowerCase().includes(q) ||
        request.email.toLowerCase().includes(q) ||
        request.reference_id.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(result);
  }, [requests, searchTerm, statusFilter]);

  // Stats calculation
  const stats = {
    pending: requests.filter(r => r.status === 'pending_approval').length,
    confirmed: requests.filter(r => r.status === 'confirmed').length,
    alternatives: requests.filter(r => r.status === 'alternatives_proposed').length,
    total: requests.length
  };

  interface ActionPayload {
    action: string;
    alternate_slots?: string[];
    adminNotes?: string;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'secondary';
      case 'alternatives_proposed': return 'warning';
      case 'needs_more_info': return 'destructive';
      case 'confirmed': return 'success';
      case 'completed': return 'outline';
      case 'canceled': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      pending_approval: 'Pending Approval',
      alternatives_proposed: 'Alternatives Proposed',
      needs_more_info: 'Needs More Info',
      confirmed: 'Confirmed',
      completed: 'Completed',
      canceled: 'Canceled'
    };
    return map[status] || status;
  };

  const handleOpenDetails = (request: ConsultationBooking) => {
    setSelectedRequest(request);
    setShowSheet(true);
  };

  const handleAction = (request: ConsultationBooking, action: 'approve' | 'propose' | 'more-info' | 'cancel') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNote('');
    setSelectedAlternativeSlots([]);
    setShowActionModal(true);
    if (action === 'propose') {
      fetchAvailableSlots();
    }
  };

  const toggleAlternativeSlot = (slotTime: string) => {
    setSelectedAlternativeSlots(prev => 
      prev.includes(slotTime) 
        ? prev.filter(s => s !== slotTime)
        : prev.length < 3 ? [...prev, slotTime] : prev
    );
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      let actionPayload: ActionPayload;

      switch (actionType) {
        case 'approve':
          actionPayload = { action: 'approve' };
          break;
        case 'propose':
          actionPayload = {
            action: 'propose_alternatives',
            alternate_slots: selectedAlternativeSlots,
            adminNotes: adminNote
          };
          break;
        case 'more-info':
          actionPayload = {
            action: 'request_more_info',
            adminNotes: adminNote
          };
          break;
        case 'cancel':
          actionPayload = { action: 'cancel' };
          break;
        default:
          actionPayload = { action: '' };
          break;
      }

      const response = await fetch(`/api/consultation?id=${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionPayload),
      });

      if (response.ok) {
        await fetchRequests();
        setShowActionModal(false);
        if (showSheet) setShowSheet(false);
      } else {
        alert('Failed to update request.');
      }
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                <Clock3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alternatives Proposed</p>
                <p className="text-2xl font-bold">{stats.alternatives}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Info className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-lg text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                <ListTodo className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-teal-800">
                Consultation Requests
              </CardTitle>
              <p className="text-sm text-muted-foreground">Manage and review incoming consultation bookings</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-9 w-55 md:w-75"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-37.5">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_approval">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="needs_more_info">Needs Info</SelectItem>
                  <SelectItem value="alternatives_proposed">Alternatives</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchRequests} disabled={loading}>
                {loading ? <Loader size="xs" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-27.5 pl-6">ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Category / Visa</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Requested Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 py-8">
                       <Loader size="md" text="Loading requests..." />
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No requests found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleOpenDetails(req)}>
                      <TableCell className="font-mono text-xs text-muted-foreground pl-6">
                        {req.reference_id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{req.full_name}</div>
                        <div className="text-xs text-muted-foreground">{req.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{req.issue_category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</div>
                        <div className="text-xs px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-sm inline-block border border-teal-100">
                          {req.visa_category.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={req.urgency === 'urgent' ? 'destructive' : 'secondary'}
                          className="capitalize font-normal text-[10px]"
                        >
                          {req.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{req.selected_slot.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {req.selected_slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "capitalize font-medium border-transparent",
                            req.status === 'confirmed' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                            req.status === 'pending_approval' ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                            "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {getStatusDisplay(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenDetails(req); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Sheet (Drawer) */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="sm:max-w-xl overflow-y-auto w-full">
          <SheetHeader className="pb-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <SheetTitle className="text-xl">Request Details</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  ID: {selectedRequest?.reference_id}
                </SheetDescription>
              </div>
              <Badge variant={selectedRequest ? getStatusBadgeVariant(selectedRequest.status) : 'secondary'}>
                {selectedRequest ? getStatusDisplay(selectedRequest.status) : ''}
              </Badge>
            </div>
          </SheetHeader>

          {selectedRequest && (
            <div className="py-6 space-y-8">
              {/* Profile Card */}
              <div className="bg-muted/40 p-4 rounded-xl border flex gap-4 items-center">
                <div className="h-14 w-14 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xl">
                  {selectedRequest.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedRequest.full_name}</h3>
                  <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {selectedRequest.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {selectedRequest.whatsapp_phone}</span>
                  </div>
                </div>
              </div>

              {/* Case Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Case Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Issue Category</p>
                    <p className="text-sm font-medium">{selectedRequest.issue_category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Visa Category</p>
                    <p className="text-sm font-medium">{selectedRequest.visa_category.toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Case Stage</p>
                    <p className="text-sm font-medium">{selectedRequest.case_stage.toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Language</p>
                    <p className="text-sm font-medium">{selectedRequest.preferred_language}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Case Summary</h4>
                <div className="bg-muted/30 p-4 rounded-lg border text-sm leading-relaxed italic">
                  &#34;{selectedRequest.case_summary}&#34;
                </div>
              </div>

              {/* Time Section */}
              <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Requested Appointment
                </h4>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold text-teal-900">
                      {selectedRequest.selected_slot.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="text-teal-700 flex items-center gap-1.5 font-medium">
                      <Clock className="h-4 w-4" /> {selectedRequest.selected_slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline (Simplified from 2.html concept) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Timeline</h4>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                  <div className="relative">
                    <div className="absolute -left-5.75 top-1.5 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-white" />
                    <p className="text-xs text-muted-foreground">{selectedRequest.created_at.toLocaleString()}</p>
                    <p className="text-sm font-medium">Request submitted by client</p>
                  </div>
                  {selectedRequest.updated_at > selectedRequest.created_at && (
                    <div className="relative">
                      <div className="absolute -left-5.75 top-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                      <p className="text-xs text-muted-foreground">{selectedRequest.updated_at.toLocaleString()}</p>
                      <p className="text-sm font-medium">Status updated to {getStatusDisplay(selectedRequest.status)}</p>
                      {selectedRequest.admin_notes && (
                        <p className="text-xs mt-1 bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">
                          <strong>Note:</strong> {selectedRequest.admin_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Sidebar-like Buttons */}
              <div className="pt-6 border-t space-y-3">
                 <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Actions</h4>
                 <div className="grid grid-cols-2 gap-3">
                   {selectedRequest.status === 'pending_approval' && (
                     <Button 
                       className="bg-green-600 hover:bg-green-700 text-white w-full gap-2" 
                       onClick={() => handleAction(selectedRequest, 'approve')}
                     >
                       <Check className="h-4 w-4" /> Approve Slot
                     </Button>
                   )}
                   <Button 
                     variant="outline" 
                     className="w-full gap-2"
                     onClick={() => handleAction(selectedRequest, 'propose')}
                   >
                     <RefreshCw className="h-4 w-4" /> Propose Alts
                   </Button>
                   <Button 
                     variant="outline" 
                     className="w-full gap-2 border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50"
                     onClick={() => handleAction(selectedRequest, 'more-info')}
                   >
                     <MessageSquare className="h-4 w-4" /> Need Info
                   </Button>
                   <Button 
                     variant="ghost" 
                     className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                     onClick={() => handleAction(selectedRequest, 'cancel')}
                   >
                     <X className="h-4 w-4" /> Cancel
                   </Button>
                 </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Dialog */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' && <CheckCircle2 className="text-green-600" />}
              {actionType === 'propose' && <RefreshCw className="text-blue-600" />}
              {actionType === 'more-info' && <MessageSquare className="text-yellow-600" />}
              {actionType === 'cancel' && <AlertTriangle className="text-red-600" />}
              {actionType === 'approve' ? 'Confirm Approval' :
               actionType === 'propose' ? 'Propose Alternatives' :
               actionType === 'more-info' ? 'Request Information' : 'Cancel Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' ? 'Are you sure you want to confirm this appointment time?' :
               actionType === 'propose' ? 'Suggest up to 3 alternative slots for the user.' :
               actionType === 'more-info' ? 'The user will be notified that you need more information.' : 
               'This will mark the request as canceled. The user will be notified.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {(actionType === 'more-info' || actionType === 'propose') && (
              <textarea
                className="w-full min-h-25 p-3 border rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder={actionType === 'more-info' ? "What info do you need? (User will see this)" : "Notes for the user regarding alternatives..."}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            )}
            
            {actionType === 'approve' && selectedRequest && (
              <div className="bg-muted p-4 rounded-lg flex items-center gap-4">
                <Calendar className="h-10 w-10 text-muted-foreground" />
                <div>
                  <div className="font-bold">{selectedRequest.selected_slot.toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">{selectedRequest.selected_slot.toLocaleTimeString()}</div>
                </div>
              </div>
            )}

            {actionType === 'propose' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="text-sm font-bold text-gray-700">Select available slots (up to 3)</h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {selectedAlternativeSlots.length}/3 Selected
                  </Badge>
                </div>
                
                {fetchingSlots ? (
                  <div className="flex justify-center py-8">
                    <Loader size="sm" text="Fetching available slots..." />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-xs text-muted-foreground">No available slots found in the system.</p>
                  </div>
                ) : (
                  <div className="max-h-50 overflow-y-auto space-y-2 pr-2">
                    {availableSlots.map((slot: TimeSlot) => {
                      const slotTime = `${slot.date} ${slot.start_time}`;
                      const isSelected = selectedAlternativeSlots.includes(slotTime);
                      return (
                        <div 
                          key={slot.id}
                          className={cn(
                            "flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all",
                            isSelected ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:border-teal-300"
                          )}
                          onClick={() => toggleAlternativeSlot(slotTime)}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">
                              {new Date(`${slot.date}T${slot.start_time}-05:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(`${slot.date}T${slot.start_time}-05:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[8px] text-teal-600 block mt-0.5">Note: Displayed in your local timezone</span>
                          </div>
                          {isSelected ? <CheckCircle2 className="h-4 w-4 text-teal-600" /> : <div className="h-4 w-4 rounded-full border border-gray-300" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                    The user will be notified to pick one of these slots or contact you for further options. 
                    The status will change to &#34;Alternatives Proposed&#34;.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowActionModal(false)}>Cancel</Button>
            <Button 
              className={cn(
                "font-medium",
                actionType === 'approve' ? "bg-green-600 hover:bg-green-700" :
                actionType === 'cancel' ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
              )}
              onClick={confirmAction}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationRequestsTable;
