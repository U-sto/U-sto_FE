import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const resetPasswordSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  verificationCode: z.string().min(1, "인증번호를 입력해주세요."),
  newPassword: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function FindPasswordPage() {
  const { resetPassword, sendVerification, checkVerification } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      username: "",
      email: "",
      verificationCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSendCode = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "이메일을 입력해주세요." });
      return;
    }
    try {
      await sendVerification.mutateAsync({ email });
      setEmailSent(true);
    } catch (e) { }
  };

  const handleVerifyCode = async () => {
    const email = form.getValues("email");
    const code = form.getValues("verificationCode");
    try {
      const result = await checkVerification.mutateAsync({ email, code });
      if (result.verified) {
        setIsVerified(true);
      }
    } catch (e) { }
  };

  const onSubmit = (data: ResetPasswordFormValues) => {
    resetPassword.mutate({
      username: data.username,
      email: data.email,
      verificationCode: data.verificationCode,
      newPassword: data.newPassword
    });
  };

  return (
    <AuthLayout title="비밀번호 찾기" subtitle="본인 확인 후 비밀번호를 재설정합니다">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="space-y-4">
             <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아이디</FormLabel>
                  <FormControl>
                    <Input placeholder="아이디 입력" {...field} className="rounded-lg h-11" disabled={isVerified} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="등록된 이메일 입력" {...field} className="rounded-lg h-11" disabled={isVerified || emailSent} />
                    </FormControl>
                    <Button 
                      type="button" 
                      onClick={handleSendCode} 
                      disabled={isVerified || emailSent || sendVerification.isPending}
                      className="whitespace-nowrap h-11"
                    >
                      {emailSent ? "전송됨" : "인증번호 전송"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {emailSent && !isVerified && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <FormField
                control={form.control}
                name="verificationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>인증번호</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="인증번호 6자리" {...field} className="rounded-lg h-11" />
                      </FormControl>
                      <Button 
                        type="button" 
                        onClick={handleVerifyCode}
                        disabled={checkVerification.isPending}
                        variant="outline"
                        className="whitespace-nowrap h-11 border-primary text-primary"
                      >
                        확인
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          )}

          {isVerified && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-4 border-t border-gray-100"
            >
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4" />
                인증되었습니다. 새로운 비밀번호를 설정해주세요.
              </div>

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>새 비밀번호</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="새 비밀번호 입력" {...field} className="rounded-lg h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호 확인</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="비밀번호 다시 입력" {...field} className="rounded-lg h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 mt-4 font-bold rounded-xl shadow-lg"
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending ? <Loader2 className="animate-spin mr-2" /> : "비밀번호 변경하기"}
              </Button>
            </motion.div>
          )}

          <div className="text-center pt-2">
            <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-1" />
              로그인 화면으로 돌아가기
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
