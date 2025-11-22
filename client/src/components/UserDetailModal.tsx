import {
  Activity,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Flag,
  Hash,
  Heart,
  Home,
  MessageSquarePlus,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getApiUrl } from '@/lib/api';

interface UserData {
  uuid: string;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  smsConsent?:
    | boolean
    | {
        given: boolean;
        timestamp?: string;
        ipAddress?: string;
      };
  [key: string]: any;
}

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  type: 'rider' | 'driver';
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  type,
}) => {
  // Local copy so we can optimistically update consent without full reload
  const [currentUser, setCurrentUser] = useState<UserData>(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  if (!currentUser) return null;

  // Record verbal SMS consent (staff action)
  const handleRecordVerbalConsent = async () => {
    // Prefer explicit rider phone, fallback to mobilePhone (for drivers or legacy records)
    let phone: string | undefined = currentUser.phone || currentUser.mobilePhone;

    // Allow staff to manually enter if missing
    if (!phone) {
      const entered = window.prompt(
        'Enter the user phone number (E.164 like +18669017244 or digits):'
      );
      if (!entered) {
        toast.error('Cannot record consent', { description: 'Phone number required.' });
        return;
      }
      phone = entered.trim();
    }

    // Basic normalization / validation
    if (!/^\+?\d{10,15}$/.test(phone)) {
      toast.error('Invalid phone number', {
        description: 'Use digits, optionally starting with +, 10-15 total.',
      });
      return;
    }

    // Ensure phone starts with + for consistency if country code implied (assume US if 10 digits)
    if (!phone.startsWith('+')) {
      if (phone.length === 10) {
        phone = `+1${phone}`; // naive US default; adapt as needed
      } else {
        phone = `+${phone}`; // fallback prefix
      }
    }

    try {
      const resp = await fetch(getApiUrl('/api/users/sms-consent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          consentGiven: true,
          timestamp: new Date().toISOString(),
          ipAddress: 'verbal', // flag for audit trail
        }),
      });
      if (resp.ok) {
        const now = new Date().toISOString();
        toast.success('Verbal consent recorded', { description: 'Confirmation SMS sent to user.' });
        // Optimistically update local state
        setCurrentUser((prev: UserData) => ({
          ...prev,
          phone: prev.phone || phone, // persist phone if it was manually entered
          smsConsent: {
            given: true,
            timestamp: now,
            ipAddress: 'verbal',
          },
        }));
      } else {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || 'Server rejected consent request');
      }
    } catch (e) {
      const error = e as Error;
      console.error('Verbal consent error', error);
      toast.error('Failed to record consent', { description: error.message });
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-primary" />
            {type === 'rider' ? 'Rider' : 'Driver'} Profile
          </DialogTitle>
          <DialogDescription>
            Complete information for {currentUser.fullName || currentUser.name || 'User'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <User className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="space-y-4 pl-6">
              {/* Name */}
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base font-semibold">
                    {currentUser.fullName || currentUser.name || 'N/A'}
                  </p>
                </div>
              </div>

              {/* UUID */}
              {currentUser.uuid && (
                <div className="flex items-start gap-3">
                  <Hash className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                    <p className="break-all font-mono text-xs text-muted-foreground">
                      {currentUser.uuid}
                    </p>
                  </div>
                </div>
              )}

              {/* Date of Birth (Riders only) */}
              {type === 'rider' && currentUser.dob && (
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-base font-semibold">{formatDate(currentUser.dob)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Age: {formatAge(currentUser.dob)} years
                    </p>
                  </div>
                </div>
              )}

              {/* Role Badge */}
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="outline" className="text-sm">
                    {type === 'rider' ? 'Rider' : 'Driver'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information Section */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Phone className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-4 pl-6">
              {/* Phone Number */}
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                  <p className="text-base font-semibold">
                    {type === 'driver'
                      ? currentUser.mobilePhone || currentUser.phone || 'N/A'
                      : currentUser.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Fax Phone (Drivers/Service Providers only) */}
              {type === 'driver' && currentUser.faxPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Fax Phone</p>
                    <p className="text-base font-semibold">{currentUser.faxPhone}</p>
                  </div>
                </div>
              )}

              {/* SMS Consent Status & Verbal Opt-In */}
              <div className="flex items-start gap-3 pt-2">
                <MessageSquarePlus className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">SMS Consent</p>
                  {typeof currentUser.smsConsent === 'object' && currentUser.smsConsent?.given ? (
                    <div className="flex flex-col gap-1">
                      <Badge className="w-fit bg-green-600 hover:bg-green-700">Opted-In</Badge>
                      {typeof currentUser.smsConsent === 'object' &&
                        currentUser.smsConsent?.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            Since: {new Date(currentUser.smsConsent.timestamp).toLocaleString()}
                          </p>
                        )}
                      {typeof currentUser.smsConsent === 'object' &&
                        currentUser.smsConsent?.ipAddress === 'verbal' && (
                          <p className="text-xs text-muted-foreground">Method: Verbal</p>
                        )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Badge variant="destructive" className="w-fit">
                        Not Opted-In
                      </Badge>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        User has not provided SMS consent. Obtain explicit verbal permission before
                        enabling.
                      </p>
                      <Button size="sm" onClick={handleRecordVerbalConsent}>
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        Record Verbal Consent
                      </Button>
                      <div className="space-y-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-blue-900">
                          📋 VERBAL OPT-IN SCRIPT (Read Verbatim):
                        </p>
                        <div className="space-y-1 text-[11px] leading-relaxed">
                          <p>
                            "This is [Your Name] from <strong>SWARM LLC</strong>, calling about your
                            Rural Dispatch transportation."
                          </p>
                          <p>
                            "We can send you text message updates with ride confirmations, driver
                            information, pickup times, and arrival notifications from our toll-free
                            number <strong>(866) 901-7244</strong>."
                          </p>
                          <p>
                            "If you prefer not to receive texts, we'll contact you by phone instead.
                            You'll receive approximately <strong>1 to 5 messages per ride</strong>.
                            Standard message and data rates may apply."
                          </p>
                          <p>
                            "At any time you can reply <strong>HELP</strong> for support or{' '}
                            <strong>STOP</strong> to opt out of text messages."
                          </p>
                          <p>
                            "Our Mobile Terms are at{' '}
                            <strong>ruraldispatch.swarmnyc.com/sms-terms</strong> and Privacy Policy
                            at <strong>ruraldispatch.swarmnyc.com/privacy</strong>."
                          </p>
                          <p className="mt-2 font-semibold text-blue-900">
                            "May we send you text updates at this number? Please say 'yes' or 'no'."
                          </p>
                          <p className="mt-2 text-[10px] italic text-muted-foreground">
                            [Wait for clear verbal "Yes", then click "Record Consent" button above]
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            After recording: "Thank you! You'll receive a confirmation text shortly.
                            Remember, you can reply STOP at any time to opt out."
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Driver/Service Provider Specific Information */}
          {type === 'driver' && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Professional Information
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Title */}
                  {currentUser.title && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Title</p>
                        <p className="text-base font-semibold">{currentUser.title}</p>
                      </div>
                    </div>
                  )}

                  {/* Organization */}
                  {currentUser.organization && (
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Organization</p>
                        <p className="text-base font-semibold">{currentUser.organization}</p>
                      </div>
                    </div>
                  )}

                  {/* Service Provider Role */}
                  {currentUser.serviceProviderRole && (
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Service Provider Role
                        </p>
                        <Badge variant="default" className="mt-1">
                          {currentUser.serviceProviderRole}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Specializations */}
                  {currentUser.specializations && (
                    <div className="flex items-start gap-3">
                      <Activity className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Specializations</p>
                        <p className="text-base font-semibold">{currentUser.specializations}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Rider Specific Information */}
          {type === 'rider' && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Race */}
                  {currentUser.race && (
                    <div className="flex items-start gap-3">
                      <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Race</p>
                        <p className="text-base font-semibold">
                          {capitalizeFirst(currentUser.race)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Marital Status */}
                  {currentUser.maritalStatus && (
                    <div className="flex items-start gap-3">
                      <Heart className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Marital Status</p>
                        <p className="text-base font-semibold">
                          {capitalizeFirst(currentUser.maritalStatus)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Veteran Status */}
                  {currentUser.veteranStatus && (
                    <div className="flex items-start gap-3">
                      <Flag className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Veteran Status</p>
                        <Badge
                          variant={
                            currentUser.veteranStatus === 'veteran' ? 'default' : 'secondary'
                          }
                        >
                          {capitalizeFirst(currentUser.veteranStatus)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Disability Status */}
                  {currentUser.disabilityStatus && (
                    <div className="flex items-start gap-3">
                      <Activity className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Disability Status
                        </p>
                        <Badge
                          variant={currentUser.disabilityStatus === 'yes' ? 'default' : 'secondary'}
                        >
                          {capitalizeFirst(currentUser.disabilityStatus)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Service User Roles */}
                  {currentUser.serviceUserRole && currentUser.serviceUserRole.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="mb-2 text-sm font-medium text-muted-foreground">
                          Service User Roles
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {currentUser.serviceUserRole.map((role: string) => (
                            <Badge key={role} variant="outline">
                              {capitalizeFirst(role)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Residence Information */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Home className="h-4 w-4" />
                  Residence History
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Current Residence */}
                  {currentUser.residence?.current && (
                    <div className="flex items-start gap-3">
                      <Home className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Current Residence
                        </p>
                        <p className="text-base font-semibold">{currentUser.residence.current}</p>
                      </div>
                    </div>
                  )}

                  {/* Last Residence */}
                  {currentUser.residence?.last && (
                    <div className="flex items-start gap-3">
                      <Home className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Residence</p>
                        <p className="text-base font-semibold">{currentUser.residence.last}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Income Information */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Income History
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Current Income */}
                  {currentUser.income?.current && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Income</p>
                        <p className="text-base font-semibold">{currentUser.income.current}</p>
                      </div>
                    </div>
                  )}

                  {/* Last Income */}
                  {currentUser.income?.last && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Income</p>
                        <p className="text-base font-semibold">{currentUser.income.last}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Account Information Section - Only show if timestamps exist */}
          {(currentUser.createdAt || currentUser.updatedAt) && (
            <>
              <Separator />

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Account Information
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Created At */}
                  {currentUser.createdAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Created</p>
                        <p className="text-base font-semibold">
                          {formatDate(currentUser.createdAt)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(currentUser.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Updated At */}
                  {currentUser.updatedAt && (
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                        <p className="text-base font-semibold">
                          {formatDate(currentUser.updatedAt)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(currentUser.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
