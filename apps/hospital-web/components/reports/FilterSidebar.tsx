import { Button, Checkbox, Input, Label, Select } from '@mire/ui';
import { ChevronDown, RotateCcw, Filter } from 'lucide-react';

export function FilterSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b p-4">
        <h2 className="text-lg font-semibold">데이터 필터</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* 1. 기간 설정 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">1. 기간 설정</h3>
          <div className="flex items-center gap-2">
            <Input defaultValue="2023.01" className="h-9 w-full text-center" />
            <span className="text-muted-foreground w-4 text-center">~</span>
            <Input defaultValue="2025.12" className="h-9 w-full text-center" />
          </div>
        </div>

        {/* 2. 환자 코호트 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">2. 환자 코호트</h3>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox checked />
              <span className="text-sm">전체 성별</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">남성만</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">여성만</span>
            </label>
          </div>

          <div className="pt-2 space-y-2 border-t">
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">PHM(유병자)만 보기</span>
            </label>
            <div className="pl-6 space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox checked />
                <span className="text-sm">당뇨(Diabetes)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm">고혈압(Hypertension)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm">골다공증(Osteoporosis)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm">흡연자(Smoker)</span>
              </label>
            </div>
          </div>

          <div className="pt-2 space-y-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">연령대</h4>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">20-29세</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">30-39세</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked />
              <span className="text-sm">40-49세</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked />
              <span className="text-sm">50-59세</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">60세 이상</span>
            </label>
          </div>
        </div>

        {/* 3. 임상 조건 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">3. 임상 조건</h3>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">상악(Maxilla)만</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">하악(Mandible)만</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">전치부만</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">구치부만</span>
            </label>
          </div>

          <div className="pt-2 space-y-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">골질(Bone Quality)</h4>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">D1 (매우 단단)</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">D2 (단단)</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">D3 (보통)</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">D4 (무름)</span>
            </label>
          </div>

          <div className="pt-2 space-y-2 border-t">
            <label className="flex items-center gap-2">
              <Checkbox checked />
              <span className="text-sm">골이식(GBR) 시행 건</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">상악동 거상술(Sinus Lift)</span>
            </label>
          </div>
        </div>

        {/* 4. 재료 조건 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">4. 재료 조건</h3>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox checked />
              <span className="text-sm">전체 제조사</span>
            </label>
            <div className="pl-6 space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm">Straumann</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm">Nobel Biocare</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm">Osstem</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox />
                <span className="text-sm">Dentium</span>
              </label>
            </div>
          </div>

          <div className="pt-2 space-y-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">픽스처 직경</h4>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">Ø3.5mm 이하</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">Ø4.0-4.5mm</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">Ø5.0mm 이상</span>
            </label>
          </div>

          <div className="pt-2 space-y-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">초기 고정력(Torque)</h4>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">20N 미만</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">20-35N</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm">35N 이상</span>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t p-4 space-y-2 bg-background">
        <Button className="w-full bg-primary hover:bg-primary-darker text-primary-foreground">
          <Filter className="w-4 h-4 mr-2" />
          필터 적용하기
        </Button>
        <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-primary/5">
          <RotateCcw className="w-4 h-4 mr-2" />
          초기화
        </Button>
      </div>
    </div>
  );
}
