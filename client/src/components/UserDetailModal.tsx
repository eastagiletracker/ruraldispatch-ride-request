import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Phone, Calendar, Clock, Hash, Shield, Activity, Briefcase, Building2, Heart, Home, DollarSign, Flag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  type: 'rider' | 'driver';
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  type,
}) => {
  if (!user) return null;

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-primary" />
            {type === 'rider' ? 'Rider' : 'Driver'} Profile
          </DialogTitle>
          <DialogDescription>
            Complete information for {user.fullName || user.name || 'User'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="space-y-4 pl-6">
              {/* Name */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-base font-semibold">{user.fullName || user.name || 'N/A'}</p>
                </div>
              </div>

              {/* UUID */}
              {user.uuid && (
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">{user.uuid}</p>
                  </div>
                </div>
              )}

              {/* Date of Birth (Riders only) */}
              {type === 'rider' && user.dob && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p className="text-base font-semibold">{formatDate(user.dob)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Age: {formatAge(user.dob)} years</p>
                  </div>
                </div>
              )}

              {/* Role Badge */}
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Role</p>
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
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="space-y-4 pl-6">
              {/* Phone Number */}
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                  <p className="text-base font-semibold">
                    {type === 'driver' ? (user.mobilePhone || user.phone || 'N/A') : (user.phone || 'N/A')}
                  </p>
                </div>
              </div>

              {/* Fax Phone (Drivers/Service Providers only) */}
              {type === 'driver' && user.faxPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Fax Phone</p>
                    <p className="text-base font-semibold">{user.faxPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Driver/Service Provider Specific Information */}
          {type === 'driver' && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional Information
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Title */}
                  {user.title && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Title</p>
                        <p className="text-base font-semibold">{user.title}</p>
                      </div>
                    </div>
                  )}

                  {/* Organization */}
                  {user.organization && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Organization</p>
                        <p className="text-base font-semibold">{user.organization}</p>
                      </div>
                    </div>
                  )}

                  {/* Service Provider Role */}
                  {user.serviceProviderRole && (
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Service Provider Role</p>
                        <Badge variant="default" className="mt-1">
                          {user.serviceProviderRole}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Specializations */}
                  {user.specializations && (
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Specializations</p>
                        <p className="text-base font-semibold">{user.specializations}</p>
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
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Race */}
                  {user.race && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Race</p>
                        <p className="text-base font-semibold">{capitalizeFirst(user.race)}</p>
                      </div>
                    </div>
                  )}

                  {/* Marital Status */}
                  {user.maritalStatus && (
                    <div className="flex items-start gap-3">
                      <Heart className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Marital Status</p>
                        <p className="text-base font-semibold">{capitalizeFirst(user.maritalStatus)}</p>
                      </div>
                    </div>
                  )}

                  {/* Veteran Status */}
                  {user.veteranStatus && (
                    <div className="flex items-start gap-3">
                      <Flag className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Veteran Status</p>
                        <Badge variant={user.veteranStatus === 'veteran' ? 'default' : 'secondary'}>
                          {capitalizeFirst(user.veteranStatus)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Disability Status */}
                  {user.disabilityStatus && (
                    <div className="flex items-start gap-3">
                      <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Disability Status</p>
                        <Badge variant={user.disabilityStatus === 'yes' ? 'default' : 'secondary'}>
                          {capitalizeFirst(user.disabilityStatus)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Service User Roles */}
                  {user.serviceUserRole && user.serviceUserRole.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Service User Roles</p>
                        <div className="flex flex-wrap gap-2">
                          {user.serviceUserRole.map((role: string, index: number) => (
                            <Badge key={index} variant="outline">
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
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Residence History
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Current Residence */}
                  {user.residence?.current && (
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Residence</p>
                        <p className="text-base font-semibold">{user.residence.current}</p>
                      </div>
                    </div>
                  )}

                  {/* Last Residence */}
                  {user.residence?.last && (
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Residence</p>
                        <p className="text-base font-semibold">{user.residence.last}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Income Information */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Income History
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Current Income */}
                  {user.income?.current && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Income</p>
                        <p className="text-base font-semibold">{user.income.current}</p>
                      </div>
                    </div>
                  )}

                  {/* Last Income */}
                  {user.income?.last && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Income</p>
                        <p className="text-base font-semibold">{user.income.last}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Account Information Section - Only show if timestamps exist */}
          {(user.createdAt || user.updatedAt) && (
            <>
              <Separator />
              
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Account Information
                </h3>
                <div className="space-y-4 pl-6">
                  {/* Created Date */}
                  {user.createdAt && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                        <p className="text-base font-semibold">{formatDate(user.createdAt)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(user.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Updated Date */}
                  {user.updatedAt && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                        <p className="text-base font-semibold">{formatDate(user.updatedAt)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(user.updatedAt)}
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
