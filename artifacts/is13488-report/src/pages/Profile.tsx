import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProfile, saveProfile } from "@/lib/storage";
import { UserProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Building2, MapPin, Hash, Phone, Mail, 
  Save, CheckCircle2, ShieldCheck, Globe
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveProfile(profile);
      toast({
        title: "Profile Updated",
        description: "Your company details have been saved and synced to the cloud.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save profile details.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl pb-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-lg">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Profile</h1>
          <p className="text-sm text-slate-500">Manage your company details and report defaults</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-4">Account Status</h3>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <User className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-sm truncate w-32">{userEmail.split('@')[0]}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Admin
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Login Email</p>
                  <p className="text-sm font-medium truncate">{userEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">System ID</p>
                  <p className="text-[10px] font-mono text-emerald-400/70">PRO-AUTH-2026-V3</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <h4 className="text-emerald-800 text-sm font-bold flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" /> Cloud Sync Active
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              All changes made here are instantly synchronized across all your devices using your secure Supabase vault.
            </p>
          </div>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8 shadow-sm border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
              <Building2 className="w-5 h-5 text-emerald-600" /> Company Personalization
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Company Name (Report Header)
                </Label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <Input 
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter Company Name"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress" className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Complete Office Address
                </Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  <Textarea 
                    id="companyAddress"
                    value={profile.companyAddress}
                    onChange={(e) => setProfile(prev => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="Enter complete address for report footer/header"
                    className="pl-10 min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="formatPrefix" className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Format No. Prefix
                  </Label>
                  <div className="relative group">
                    <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input 
                      id="formatPrefix"
                      value={profile.formatNoPrefix}
                      onChange={(e) => setProfile(prev => ({ ...prev, formatNoPrefix: e.target.value }))}
                      placeholder="e.g. QC/2025-26"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic">This will be the default prefix for all new reports.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Contact Person
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input 
                      id="contactPerson"
                      value={profile.contactPerson || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Manager Name"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Phone Number
                  </Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input 
                      id="phone"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 00000 00000"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Business Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <Input 
                      id="email"
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="business@company.com"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-600/20"
              >
                {isSaving ? (
                  <>Saving Changes...</>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Profile Details
                  </span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
