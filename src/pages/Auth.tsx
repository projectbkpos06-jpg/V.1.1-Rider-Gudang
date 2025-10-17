import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signIn, signUp, resetPassword, resendVerificationEmail } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Package, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail) {
      toast.error("Mohon masukkan email Anda terlebih dahulu");
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await resetPassword(loginEmail);

      if (error) {
        console.error("Reset password error:", error);
        toast.error(`Gagal mengirim email reset password: ${error.message}`);
        return;
      }

      toast.success("Email reset password telah dikirim! Silakan cek email Anda.");
      setLoginEmail("");
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof Error) {
        toast.error(`Terjadi kesalahan: ${error.message}`);
      } else {
        toast.error("Terjadi kesalahan saat mengirim email reset password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (email: string) => {
    try {
      const { error } = await resendVerificationEmail(email);
      if (error) {
        toast.error("Gagal mengirim ulang email verifikasi");
        return;
      }
      toast.success("Email verifikasi telah dikirim ulang. Silakan cek email Anda.");
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengirim ulang email verifikasi");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Email dan password harus diisi");
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Starting login process...');
      const { data, error, needsVerification } = await signIn(loginEmail, loginPassword);

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message);
        
        if (needsVerification) {
          toast.info(
            <div>
              <p>Kirim ulang email verifikasi?</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => handleResendVerification(loginEmail)}
              >
                Kirim Ulang
              </Button>
            </div>
          );
        }
        return;
      }

      if (!data?.user) {
        console.error('No user data returned');
        toast.error("Gagal mendapatkan data user");
        return;
      }

      console.log('Login successful:', data.user);
      toast.success("Berhasil login!");
      navigate("/dashboard");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signUp(signupEmail, signupPassword, signupFullName);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email sudah terdaftar");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Pendaftaran berhasil! Silakan login.");
        setSignupEmail("");
        setSignupPassword("");
        setSignupFullName("");
        setSignupConfirmPassword("");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mendaftar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
          <div className="p-3">
              <img 
                src="/images/logo.png" 
                alt="Company Logo"
                className="h-16 w-16 object-contain"
              />
          </div>
          </div>
          <CardTitle className="text-3xl font-bold">BK Storage & Rider</CardTitle>
          <CardDescription>
            Kelola stok, distribusi, dan penjualan dengan mudah
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Daftar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full mb-2" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Login"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm text-muted-foreground hover:text-primary"
                  disabled={isLoading}
                  onClick={(e) => handleResetPassword(e)}
                >
                  Lupa Password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nama Lengkap</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Konfirmasi Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showSignupConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    >
                      {showSignupConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Memproses..." : "Daftar sebagai Rider"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Pendaftaran baru akan menjadi pengguna Rider/Kasir
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
