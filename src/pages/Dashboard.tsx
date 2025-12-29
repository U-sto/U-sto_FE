import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Package, User, Building2 } from "lucide-react";

export default function Dashboard() {
  const { logout } = useAuth();
  
  // This is a placeholder dashboard to show after login
  // In a real app, this would query the user's profile and assets

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-primary tracking-tight hidden sm:block">
              대학물품관리시스템
            </span>
          </div>
          <Button 
            onClick={() => logout.mutate()} 
            variant="ghost" 
            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-500">물품 관리 및 대여 현황을 확인하세요.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                내 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">로그인된 사용자 정보를 관리합니다.</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">접속중</span>
                <Button variant="link" size="sm" className="h-auto p-0">프로필 보기 &rarr;</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                대여 중인 물품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-500 mt-1">현재 대여 중인 물품이 없습니다.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                학과 자산 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">소속 학과의 전체 자산을 조회합니다.</p>
              <Button className="w-full mt-4" variant="outline">자산 조회하기</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
