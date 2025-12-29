import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type RegisterRequest, type LoginRequest, type FindIdRequest, type ResetPasswordRequest, type SendVerificationRequest, type CheckVerificationRequest, type CheckUsernameRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        throw new Error("로그인에 실패했습니다.");
      }
      
      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (user) => {
      toast({
        title: "로그인 성공",
        description: `${user.name}님 환영합니다.`,
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "로그인 실패",
        description: error.message,
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const validated = api.auth.register.input.parse(data);
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "회원가입에 실패했습니다.");
      }

      return api.auth.register.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "회원가입 완료",
        description: "로그인 페이지로 이동합니다.",
      });
      setLocation("/login");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: error.message,
      });
    },
  });

  const sendVerificationMutation = useMutation({
    mutationFn: async (data: SendVerificationRequest) => {
      const res = await fetch(api.auth.sendVerification.path, {
        method: api.auth.sendVerification.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("인증번호 전송 실패");
      return api.auth.sendVerification.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "인증번호 전송됨", description: "이메일을 확인해주세요." });
    },
  });

  const checkVerificationMutation = useMutation({
    mutationFn: async (data: CheckVerificationRequest) => {
      const res = await fetch(api.auth.checkVerification.path, {
        method: api.auth.checkVerification.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("인증 실패");
      return api.auth.checkVerification.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast({ title: "인증 성공", description: "이메일 인증이 완료되었습니다." });
      }
    },
    onError: () => {
      toast({ variant: "destructive", title: "인증 실패", description: "인증번호를 확인해주세요." });
    }
  });

  const findIdMutation = useMutation({
    mutationFn: async (data: FindIdRequest) => {
      const res = await fetch(api.auth.findId.path, {
        method: api.auth.findId.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("사용자를 찾을 수 없습니다.");
      return api.auth.findId.responses[200].parse(await res.json());
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      const res = await fetch(api.auth.resetPassword.path, {
        method: api.auth.resetPassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("비밀번호 재설정 실패");
      return api.auth.resetPassword.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "성공", description: "비밀번호가 변경되었습니다. 로그인해주세요." });
      setLocation("/login");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method });
    },
    onSuccess: () => {
      setLocation("/login");
      toast({ title: "로그아웃", description: "성공적으로 로그아웃되었습니다." });
    },
  });

  const checkUsernameMutation = useMutation({
    mutationFn: async (data: CheckUsernameRequest) => {
      const res = await fetch(api.auth.checkUsername.path, {
        method: api.auth.checkUsername.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("확인 실패");
      return api.auth.checkUsername.responses[200].parse(await res.json());
    },
  });

  return {
    login: loginMutation,
    register: registerMutation,
    sendVerification: sendVerificationMutation,
    checkVerification: checkVerificationMutation,
    findId: findIdMutation,
    resetPassword: resetPasswordMutation,
    logout: logoutMutation,
    checkUsername: checkUsernameMutation,
  };
}
