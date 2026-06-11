import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Users, Phone, Mail, Calendar, KeyRound, Copy, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

export default function AdminCustomers() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = trpc.adminCustomers.list.useQuery({
    search: searchQuery || undefined,
    limit,
    offset: page * limit,
  });

  // Reset link dialog
  const [resetDialog, setResetDialog] = useState<{ customerId: number; customerName: string } | null>(null);
  const [resetUrl, setResetUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const generateLinkMutation = trpc.passwordReset.generateLink.useMutation({
    onSuccess: (result) => {
      setResetUrl(result.resetUrl);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(0);
  };

  const handleGenerateLink = (customerId: number, customerName: string) => {
    setResetDialog({ customerId, customerName });
    setResetUrl("");
    setCopied(false);
    generateLinkMutation.mutate({
      customerId,
      origin: window.location.origin,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      toast.success("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { if (window.history.length > 1) window.history.back(); else setLocation('/admin'); }}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            จัดการสมาชิก
          </h1>
          <p className="text-sm text-muted-foreground">ค้นหาและจัดการข้อมูลสมาชิก</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, อีเมล..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              ค้นหา
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-2">กำลังโหลด...</p>
        </div>
      ) : !data || data.customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "ไม่พบสมาชิกที่ตรงกับคำค้นหา" : "ยังไม่มีสมาชิก"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            พบ {data.total} สมาชิก {searchQuery && `(ค้นหา: "${searchQuery}")`}
          </div>

          <div className="space-y-3">
            {data.customers.map((customer: any) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{customer.name}</h3>
                        <Badge variant="outline" className="text-xs">ID: {customer.id}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {customer.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          สมัคร: {formatDate(customer.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateLink(customer.id, customer.name)}
                      className="shrink-0"
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      รีเซ็ตรหัสผ่าน
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                หน้า {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Reset Link Dialog */}
      <Dialog open={!!resetDialog} onOpenChange={(open) => { if (!open) setResetDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              รีเซ็ตรหัสผ่าน
            </DialogTitle>
            <DialogDescription>
              สร้างลิงก์รีเซ็ตรหัสผ่านสำหรับ <strong>{resetDialog?.customerName}</strong>
            </DialogDescription>
          </DialogHeader>

          {generateLinkMutation.isPending ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground mt-2">กำลังสร้างลิงก์...</p>
            </div>
          ) : resetUrl ? (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">ลิงก์รีเซ็ตรหัสผ่าน (หมดอายุ 24 ชม.)</p>
                <p className="text-sm break-all font-mono">{resetUrl}</p>
              </div>
              <Button
                className="w-full"
                onClick={handleCopy}
                variant={copied ? "outline" : "default"}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    คัดลอกแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    คัดลอกลิงก์
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                คัดลอกลิงก์นี้แล้วส่งให้ลูกค้าทาง LINE หรืออีเมล
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
