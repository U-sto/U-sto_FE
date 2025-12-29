import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormValues) {
    login.mutate(data);
  }

  return (
    <AuthLayout title="대학물품관리시스템" subtitle="로그인하여 서비스를 이용하세요">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700">아이디</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="아이디를 입력하세요" 
                    {...field} 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-gray-700">비밀번호</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="비밀번호를 입력하세요" 
                    {...field} 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            disabled={login.isPending}
          >
            {login.isPending ? <Loader2 className="animate-spin mr-2" /> : "로그인"}
          </Button>

          <div className="flex flex-col space-y-3 pt-2">
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <Link href="/find-id" className="hover:text-primary transition-colors">아이디 찾기</Link>
              <span className="text-gray-300">|</span>
              <Link href="/find-password" className="hover:text-primary transition-colors">비밀번호 찾기</Link>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">계정이 없으신가요? </span>
              <Link href="/register" className="text-sm font-bold text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
