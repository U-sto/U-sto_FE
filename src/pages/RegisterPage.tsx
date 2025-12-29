import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, DEPARTMENTS } from "@shared/schema";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Check, X } from "lucide-react";
import { z } from "zod";

const emailVerificationSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  verificationCode: z.string().min(6, "인증번호를 입력해주세요."),
});

type EmailVerificationValues = z.infer<typeof emailVerificationSchema>;

const registerDetailsSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
});

type RegisterDetailsValues = z.infer<typeof registerDetailsSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState<"email" | "details">("email");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkedUsername, setCheckedUsername] = useState<string>("");
  const [departmentInput, setDepartmentInput] = useState<string>("");
  const [showDepartmentSuggestions, setShowDepartmentSuggestions] = useState<boolean>(false);

  const { sendVerification, checkVerification, register, checkUsername } = useAuth();

  // Filter department suggestions based on input
  const departmentSuggestions = useMemo(() => {
    if (!departmentInput.trim()) return [];
    return DEPARTMENTS.filter((dept) =>
      dept.toLowerCase().includes(departmentInput.toLowerCase())
    );
  }, [departmentInput]);

  // Step 1: Email Verification Form
  const emailForm = useForm<EmailVerificationValues>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: "",
      verificationCode: "",
    },
  });

  // Step 2: Registration Details Form
  const detailsForm = useForm<RegisterDetailsValues>({
    resolver: zodResolver(registerDetailsSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: verifiedEmail,
      department: "",
    },
  });

  // Handle email verification
  const onEmailSubmit = async (data: EmailVerificationValues) => {
    try {
      await sendVerification.mutateAsync({ email: data.email });
      // After sending code, wait for user input
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle verification code check
  const onVerificationCodeSubmit = async () => {
    const email = emailForm.getValues("email");
    const code = emailForm.getValues("verificationCode");
    
    try {
      const result = await checkVerification.mutateAsync({ email, code });
      if (result.verified) {
        setVerifiedEmail(email);
        detailsForm.setValue("email", email);
        setStep("details");
        emailForm.reset();
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Handle username availability check
  const onCheckUsername = async () => {
    const username = detailsForm.getValues("username");
    if (!username) return;

    try {
      const result = await checkUsername.mutateAsync({ username });
      setUsernameAvailable(result.available);
      setCheckedUsername(username);
    } catch (error) {
      setUsernameAvailable(false);
    }
  };

  // Handle registration
  const onDetailsSubmit = (data: RegisterDetailsValues) => {
    if (!usernameAvailable) {
      // Show error if username not checked or not available
      return;
    }
    const { confirmPassword, ...requestData } = data;
    register.mutate(requestData);
  };

  // Step 1: Email Verification
  if (step === "email") {
    return (
      <AuthLayout title="회원가입" subtitle="이메일 인증을 완료해 주세요">
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Input
                        type="email"
                        placeholder="your@hanyang.ac.kr"
                        {...field}
                        className="rounded-lg"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      onClick={() => onEmailSubmit(emailForm.getValues())}
                      disabled={sendVerification.isPending || !emailForm.getValues("email")}
                      className="rounded-lg"
                    >
                      {sendVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증번호"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sendVerification.isSuccess && (
              <FormField
                control={emailForm.control}
                name="verificationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>인증번호</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <Input
                          placeholder="123456"
                          {...field}
                          className="rounded-lg"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        onClick={onVerificationCodeSubmit}
                        disabled={checkVerification.isPending || !emailForm.getValues("verificationCode")}
                        className="rounded-lg"
                      >
                        {checkVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "인증하기"}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="text-center pt-2">
              <span className="text-sm text-gray-500">이미 계정이 있으신가요? </span>
              <Link href="/login" className="text-sm font-bold text-primary hover:underline">
                로그인
              </Link>
            </div>
          </form>
        </Form>
      </AuthLayout>
    );
  }

  // Step 2: Registration Details
  return (
    <AuthLayout title="회원가입" subtitle="상세 정보를 입력해 주세요">
      <Form {...detailsForm}>
        <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-4">
          <FormField
            control={detailsForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동" {...field} className="rounded-lg" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={detailsForm.control}
            name="department"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>소속</FormLabel>
                <FormControl>
                  <Input
                    placeholder="예) 공학대학행정팀"
                    value={field.value || departmentInput}
                    onChange={(e) => {
                      field.onChange(e);
                      setDepartmentInput(e.target.value);
                      setShowDepartmentSuggestions(true);
                    }}
                    onFocus={() => setShowDepartmentSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDepartmentSuggestions(false), 200)}
                    className="rounded-lg"
                  />
                </FormControl>
                {showDepartmentSuggestions && departmentSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {departmentSuggestions.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          field.onChange(dept);
                          setDepartmentInput(dept);
                          setShowDepartmentSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={detailsForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>아이디</FormLabel>
                <div className="flex gap-2">
                  <FormControl className="flex-1">
                    <Input
                      placeholder="사용할 아이디"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setUsernameAvailable(null);
                      }}
                      className="rounded-lg"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    onClick={onCheckUsername}
                    disabled={checkUsername.isPending || !detailsForm.getValues("username")}
                    className="rounded-lg"
                  >
                    {checkUsername.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "중복확인"
                    )}
                  </Button>
                </div>
                {usernameAvailable !== null && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    {usernameAvailable && checkedUsername === detailsForm.getValues("username") ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">사용 가능한 아이디입니다.</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">이미 사용 중인 아이디입니다.</span>
                      </>
                    )}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={detailsForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} className="rounded-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={detailsForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} className="rounded-lg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 mt-6 font-bold rounded-xl shadow-md"
            disabled={register.isPending || !usernameAvailable}
          >
            {register.isPending ? <Loader2 className="animate-spin mr-2" /> : "가입하기"}
          </Button>

          <div className="text-center pt-2">
            <span className="text-sm text-gray-500">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-sm font-bold text-primary hover:underline">
              로그인
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
