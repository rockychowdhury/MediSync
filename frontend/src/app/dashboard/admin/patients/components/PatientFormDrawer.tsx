import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Info, 
  Loader2, 
  Save, 
  AlertCircle,
  BellRing,
  UserCheck
} from "lucide-react";
import { differenceInYears, isValid } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientsApi } from "@/lib/api/patients";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  notification_opt_out: z.boolean().default(false),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: any;
  onSuccess: () => void;
}

export function PatientFormDrawer({ isOpen, onClose, patient, onSuccess }: PatientFormDrawerProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!patient;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      date_of_birth: "",
      gender: "prefer_not_to_say",
      notification_opt_out: false,
    },
  });

  useEffect(() => {
    if (patient) {
      form.reset({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        date_of_birth: patient.date_of_birth || "",
        gender: patient.gender || "prefer_not_to_say",
        notification_opt_out: patient.notification_opt_out || false,
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        email: "",
        date_of_birth: "",
        gender: "prefer_not_to_say",
        notification_opt_out: false,
      });
    }
  }, [patient, form, isOpen]);

  const onSubmit: SubmitHandler<PatientFormValues> = async (values) => {
    setLoading(true);
    try {
      const response = isEdit 
        ? await patientsApi.updatePatient(patient.id, values)
        : await patientsApi.createPatient(values);
      
      if (response.success) {
        toast.success(`Patient record ${isEdit ? "updated" : "created"} successfully.`);
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Form submission failed", error);
      const msg = error.response?.data?.message || "Process failed. Please verify the input data.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const dobValue = form.watch("date_of_birth");
  const age = dobValue && isValid(new Date(dobValue)) 
    ? differenceInYears(new Date(), new Date(dobValue)) 
    : null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 border-none bg-slate-50/50 backdrop-blur-xl transition-all duration-500">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-2xl">
          <SheetHeader className="p-8 border-b border-slate-50 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-black text-slate-800 tracking-tight">
                  {isEdit ? "Update Registry Record" : "Register New Patient"}
                </SheetTitle>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mt-1">
                   {isEdit ? `Modifying: ${patient.name}` : "Clinical Enrollment Process"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 pb-10">
                {/* SECTION 1: Personal Info */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                       <User size={18} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Identity Details</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Full Legal Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="h-12 rounded-xl border-slate-100 focus:ring-blue-500/20" />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="01711-000000" {...field} value={field.value || ""} className="h-12 rounded-xl border-slate-100 focus:ring-blue-500/20" />
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} value={field.value || ""} className="h-12 rounded-xl border-slate-100 focus:ring-blue-500/20" />
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date_of_birth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Date of Birth</FormLabel>
                          <FormControl>
                            <div className="relative">
                               <Input type="date" {...field} value={field.value || ""} className="h-12 rounded-xl border-slate-100 focus:ring-blue-500/20 pr-10" />
                               {age !== null && (
                                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Badge variant="outline" className="h-6 bg-slate-50 text-[10px] font-black">{age} YRS</Badge>
                                 </div>
                               )}
                            </div>
                          </FormControl>
                          <FormDescription className="text-[9px] font-bold italic">Clinical age is calculated automatically.</FormDescription>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "prefer_not_to_say"}>
                            <FormControl>
                              <SelectTrigger className="h-12 rounded-xl border-slate-100 focus:ring-blue-500/20 text-slate-700">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                              <SelectItem value="male" className="rounded-lg">Male</SelectItem>
                              <SelectItem value="female" className="rounded-lg">Female</SelectItem>
                              <SelectItem value="other" className="rounded-lg">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say" className="rounded-lg">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px] font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <div className="h-px bg-slate-50" />

                {/* SECTION 2: Comms Pref */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                       <BellRing size={18} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Communication Registry</h3>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-4">
                    <FormField
                      control={form.control}
                      name="notification_opt_out"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-[1rem] p-0">
                          <div className="space-y-0.5">
                            <FormLabel className="text-[11px] font-black uppercase tracking-widest text-slate-700">Clinical Reminders</FormLabel>
                            <FormDescription className="text-[10px] text-slate-500 font-bold leading-relaxed pr-8">
                               Patient will receive automated appointment alerts via Email and SMS.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={!field.value}
                              onCheckedChange={(checked) => field.onChange(!checked)}
                              className="data-[state=checked]:bg-blue-600"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {!form.watch("notification_opt_out") ? (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 animate-in fade-in zoom-in duration-300">
                        <UserCheck className="w-4 h-4 shrink-0" />
                        <p className="text-[10px] font-bold italic leading-tight">Patient successfully enrolled in the automated notification registry.</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="text-[10px] font-bold italic leading-tight">Patient has opted out. No communications will be sent automatically.</p>
                      </div>
                    )}
                  </div>
                </section>

                <div className="pt-10 flex gap-4">
                   <Button variant="outline" type="button" onClick={onClose} className="h-12 flex-1 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                      Discard Changes
                   </Button>
                   <Button type="submit" disabled={loading} className="h-12 flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 gap-2">
                       {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                       {isEdit ? "Update Registry" : "Enroll Patient"}
                   </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
