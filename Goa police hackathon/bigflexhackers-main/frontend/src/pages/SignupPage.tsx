import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, Lock, Building, Badge, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config/api';

// Zod schema for form validation
const signupSchema = z.object({
  officerId: z.string()
    .min(3, 'Officer ID must be at least 3 characters')
    .max(20, 'Officer ID must be less than 20 characters')
    .regex(/^[A-Z0-9]+$/, 'Officer ID must contain only uppercase letters and numbers'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
  rank: z.enum(['PI', 'PSI', 'ASI', 'HC', 'PC', 'LPC'], {
    errorMap: () => ({ message: 'Please select a valid rank' })
  }),
  homePoliceStation: z.string()
    .min(2, 'Police station name must be at least 2 characters')
    .max(100, 'Police station name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  role: z.enum(['Officer', 'Supervisor'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

const SignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange'
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    
    try {
      // Remove confirmPassword from the data before sending
      const { confirmPassword, ...signupData } = data;
      
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: `Welcome ${result.officer.name}! You can now sign in with your credentials.`,
          duration: 5000,
        });
        navigate('/login');
      } else {
        toast({
          title: "Registration Failed",
          description: result.error || result.details || "Unable to create account",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "Failed to connect to server. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignupForm) => {
    trigger(field);
  };

  const handlePaste = async (field: keyof SignupForm) => {
    setTimeout(() => {
      trigger(field);
    }, 10);
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

        {/* Signup Card */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-primary">Create Account</CardTitle>
            <CardDescription>
              Register as a new officer in the system
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Officer ID Field */}
              <div className="space-y-2">
                <Label htmlFor="officerId" className="text-sm font-medium">
                  Officer ID *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="officerId"
                    type="text"
                    placeholder="e.g., OFF001"
                    className="pl-10 h-12"
                    onPaste={() => handlePaste('officerId')}
                    onChange={(e) => {
                      register('officerId').onChange(e);
                      handleInputChange('officerId');
                    }}
                    {...register('officerId')}
                  />
                </div>
                {errors.officerId && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.officerId.message}
                  </p>
                )}
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 h-12"
                    onPaste={() => handlePaste('name')}
                    onChange={(e) => {
                      register('name').onChange(e);
                      handleInputChange('name');
                    }}
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Rank Field */}
              <div className="space-y-2">
                <Label htmlFor="rank" className="text-sm font-medium">
                  Rank *
                </Label>
                <div className="relative">
                  <Badge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select onValueChange={(value) => {
                    setValue('rank', value as any);
                    handleInputChange('rank');
                  }}>
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue placeholder="Select your rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PI">Police Inspector (PI)</SelectItem>
                      <SelectItem value="PSI">Police Sub-Inspector (PSI)</SelectItem>
                      <SelectItem value="ASI">Assistant Sub-Inspector (ASI)</SelectItem>
                      <SelectItem value="HC">Head Constable (HC)</SelectItem>
                      <SelectItem value="PC">Police Constable (PC)</SelectItem>
                      <SelectItem value="LPC">Lady Police Constable (LPC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.rank && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.rank.message}
                  </p>
                )}
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Role *
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select onValueChange={(value) => {
                    setValue('role', value as any);
                    handleInputChange('role');
                  }}>
                    <SelectTrigger className="pl-10 h-12">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Officer">Officer</SelectItem>
                      <SelectItem value="Supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.role && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Police Station Field */}
              <div className="space-y-2">
                <Label htmlFor="homePoliceStation" className="text-sm font-medium">
                  Home Police Station *
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="homePoliceStation"
                    type="text"
                    placeholder="e.g., Central Police Station"
                    className="pl-10 h-12"
                    onPaste={() => handlePaste('homePoliceStation')}
                    onChange={(e) => {
                      register('homePoliceStation').onChange(e);
                      handleInputChange('homePoliceStation');
                    }}
                    {...register('homePoliceStation')}
                  />
                </div>
                {errors.homePoliceStation && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.homePoliceStation.message}
                  </p>
                )}
              </div>

              {/* Email Field (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email (Optional)
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@police.gov.in"
                    className="pl-10 h-12"
                    onPaste={() => handlePaste('email')}
                    onChange={(e) => {
                      register('email').onChange(e);
                      handleInputChange('email');
                    }}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password *
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
                    {...register('password')}
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 h-12"
                    onPaste={() => handlePaste('confirmPassword')}
                    onChange={(e) => {
                      register('confirmPassword').onChange(e);
                      handleInputChange('confirmPassword');
                    }}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login Link */}
            <div className="pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-primary hover:text-primary/80 font-medium underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
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

export default SignupPage;
