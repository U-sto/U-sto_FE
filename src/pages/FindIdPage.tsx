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

const findIdSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  verificationCode: z.string().min(1, "인증번호를 입력해주세요."),
});

type FindIdFormValues = z.infer<typeof findIdSchema>;

export default function FindIdPage() {
  const { findId, sendVerification, checkVerification } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [foundId, setFoundId] = useState<string | null>(null);
  
  const form = useForm<FindIdFormValues>({
    resolver: zodResolver(findIdSchema),
    defaultValues: {
      name: "",
      email: "",
      verificationCode: "",
    },
  });

  // Handler to send email code
  const handleSendCode = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", { message: "이메일을 입력해주세요." });
      return;
    }
    
    try {
      await sendVerification.mutateAsync({ email });
      setEmailSent(true);
    } catch (e) {
      // Error handling is done in mutation
    }
  };

  // Handler to verify code
  const handleVerifyCode = async () => {
    const email = form.getValues("email");
    const code = form.getValues("verificationCode");
    
    try {
      const result = await checkVerification.mutateAsync({ email, code });
      if (result.verified) {
        setIsVerified(true);
      }
    } catch (e) {
      // Error handling is done in mutation
    }
  };

  // Final submission to find ID
  const onSubmit = async (data: FindIdFormValues) => {
    if (!isVerified) return;
    
    try {
      const result = await findId.mutateAsync({ name: data.name, email: data.email });
      setFoundId(result.username);
    } catch (e) {
      // Error handling is done in mutation
    }
  };

  if (foundId) {
    return (
      <AuthLayout title="아이디 찾기 성공" subtitle="회원님의 아이디를 확인해주세요">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-gray-600 text-sm">회원님의 아이디는</p>
            <p className="text-2xl font-bold text-gray-900 tracking-wide">{foundId}</p>
            <p className="text-gray-600 text-sm">입니다.</p>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <Link href="/login" className="w-full">
            <Button className="w-full h-12 font-bold rounded-xl">로그인하러 가기</Button>
          </Link>
          <Link href="/find-password">
            <Button variant="outline" className="w-full h-12 font-bold rounded-xl">비밀번호 찾기</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="아이디 찾기" subtitle="등록된 이메일로 인증하여 아이디를 찾습니다">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input placeholder="이름 입력" {...field} className="rounded-lg h-11" disabled={isVerified} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="이메일 입력" {...field} className="rounded-lg h-11" disabled={isVerified || emailSent} />
                    </FormControl>
                    <Button 
                      type="button" 
                      onClick={handleSendCode} 
                      disabled={isVerified || emailSent || sendVerification.isPending}
                      className="whitespace-nowrap h-11"
                    >
                      {emailSent ? "전송완료" : "인증요청"}
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
                        className="whitespace-nowrap h-11 border-primary text-primary hover:bg-primary/5"
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
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              이메일 인증이 완료되었습니다.
            </motion.div>
          )}

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 font-bold rounded-xl shadow-lg"
              disabled={!isVerified || findId.isPending}
            >
              {findId.isPending ? <Loader2 className="animate-spin mr-2" /> : "아이디 찾기"}
            </Button>
          </div>

          <div className="text-center">
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

// Import motion for animation
import { motion } from "framer-motion";
