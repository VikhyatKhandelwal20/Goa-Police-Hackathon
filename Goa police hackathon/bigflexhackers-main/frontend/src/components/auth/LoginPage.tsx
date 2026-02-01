import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const { register, handleSubmit, formState: { errors }, trigger, setValue, watch } = useForm<LoginForm>({
    mode: 'onChange' // Enable real-time validation
  });

  const usernameValue = watch('username');
  const passwordValue = watch('password');

  const onSubmit = async (data: LoginForm) => {
    const success = await login(data.username, data.password);
    
    if (success) {
      toast({
        title: "Login Successful",
        description: "Welcome to Police Deployment System",
        duration: 3000,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  const fillCredentials = (username: string, password: string) => {
    setValue('username', username);
    setValue('password', password);
    // Trigger validation after setting values
    trigger(['username', 'password']);
  };

  const handlePaste = async (field: 'username' | 'password') => {
    // Small delay to allow paste to complete
    setTimeout(() => {
      trigger(field);
    }, 10);
  };

  const handleInputChange = (field: 'username' | 'password') => {
    // Trigger validation on input change
    trigger(field);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-elevated">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Police Deployment</h1>
          <p className="text-muted-foreground">Bandobast Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-primary">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Officer ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your Officer ID"
                    className="pl-10 h-12"
                    onPaste={() => handlePaste('username')}
                    onChange={(e) => {
                      register('username').onChange(e);
                      handleInputChange('username');
                    }}
                    {...register('username', { 
                      required: 'Officer ID is required',
                      minLength: { value: 3, message: 'Officer ID must be at least 3 characters' }
                    })}
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12"
                    onPaste={() => handlePaste('password')}
                    onChange={(e) => {
                      register('password').onChange(e);
                      handleInputChange('password');
                    }}
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                variant="police" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-primary hover:text-primary/80 font-medium underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm text-muted-foreground">Demo Credentials</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCredentials(!showCredentials)}
                >
                  {showCredentials ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              
              {showCredentials && (
                <div className="space-y-2 text-xs">
                  <div className="bg-secondary/50 p-3 rounded-md">
                    <div className="font-medium text-primary mb-1">Supervisor Access</div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div>Officer ID: SUP_PERNEM_SDPO</div>
                        <div>Password: admin123</div>
                        <div className="text-xs text-muted-foreground">Rakesh Kumar</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillCredentials('SUP_PERNEM_SDPO', 'admin123')}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 p-3 rounded-md">
                    <div className="font-medium text-primary mb-1">Officer Access</div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div>Officer ID: OFF_MOPA_PI_01</div>
                        <div>Password: police123</div>
                        <div className="text-xs text-muted-foreground">Anjali Sharma</div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fillCredentials('OFF_MOPA_PI_01', 'police123')}
                      >
                        Use
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/50 p-3 rounded-md">
                    <div className="font-medium text-primary mb-1">Additional Officers</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <div>OFF_MAPUSA_PC_01 - Suresh Patil</div>
                          <div>OFF_PERNEM_PC_01 - Amit Verma</div>
                          <div>OFF_PANAJI_PC_01 - Vikram Joshi</div>
                        </div>
                        <div className="text-muted-foreground">Password: police123</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Made with ❤️ by Big Flex Hackers</p>
          <p>Ashmit, Vikhyat, Tanuj and Nimish</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;