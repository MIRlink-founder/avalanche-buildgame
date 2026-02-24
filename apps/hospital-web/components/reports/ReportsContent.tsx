import { Download, FileText, Users, Activity, Package } from 'lucide-react';
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@mire/ui';

export function ReportsContent() {
  return (
    <div className="min-h-full p-6 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      
      {/* Header Area */}
      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              데이터 리포트
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">검색 결과:</span>
              <span className="text-xl font-bold text-neutral-900">152,430 <span className="text-sm font-normal text-muted-foreground">건</span></span>
              <span className="px-2 py-0.5 ml-4 bg-primary/10 rounded-md text-xs text-primary-darker flex items-center gap-1 border border-primary/20">
                데이터 신뢰도: <span className="flex text-primary tracking-[2px]">★★★★★</span> High
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <FileText className="w-4 h-4 mr-2" />
              PDF 리포트
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="w-4 h-4 mr-2" />
              Raw Data 다운로드
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-neutral-50 px-3 py-2 rounded-md">
          <span>필터 조건: 2023.01-2025.12 / 당뇨환자 / 40-59세 / GBR 시행</span>
          <span>통계적 유의성: p &lt; 0.001 (95% CI)</span>
        </div>
        
        {/* Tabs Dummy */}
        <div className="flex space-x-6 pt-2">
          <button className="flex items-center gap-2 pb-3 border-b-2 border-primary font-medium text-sm text-primary">
            <Users className="w-4 h-4" />
            인구학적 통계
          </button>
          <button className="flex items-center gap-2 pb-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-neutral-900">
            <Activity className="w-4 h-4" />
            임상/수술 통계
          </button>
          <button className="flex items-center gap-2 pb-3 border-b-2 border-transparent text-sm text-muted-foreground hover:text-neutral-900">
            <Package className="w-4 h-4" />
            재료/제품 통계
          </button>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Chart 1: 골질 분포 */}
        <Card className="p-6">
          <h3 className="font-medium mb-8">골질 분포</h3>
          <div className="h-[200px] flex items-end justify-between px-10 gap-8">
            <div className="flex flex-col items-center gap-3 w-full group">
              <div className="w-full bg-primary rounded-sm h-[80px] transition-all hover:bg-primary-darker"></div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">20%</div>
                <div className="text-sm font-medium">D1</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 w-full group">
              <div className="w-full bg-primary rounded-sm h-[140px] transition-all hover:bg-primary-darker"></div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">35%</div>
                <div className="text-sm font-medium">D2</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 w-full group">
              <div className="w-full bg-primary rounded-sm h-[120px] transition-all hover:bg-primary-darker"></div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">30%</div>
                <div className="text-sm font-medium">D3</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 w-full group">
              <div className="w-full bg-primary rounded-sm h-[60px] transition-all hover:bg-primary-darker"></div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">15%</div>
                <div className="text-sm font-medium">D4</div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>D1 (매우 단단):</span> <span>30,486 건</span></div>
            <div className="flex justify-between"><span>D2 (단단):</span> <span>53,351 건</span></div>
            <div className="flex justify-between"><span>D3 (보통):</span> <span>45,729 건</span></div>
            <div className="flex justify-between"><span>D4 (무름):</span> <span>22,864 건</span></div>
          </div>
        </Card>

        {/* Chart 2: 골질별 평균 초기 고정력(Torque) */}
        <Card className="p-6">
          <h3 className="font-medium mb-8">골질별 평균 초기 고정력(Torque)</h3>
          <div className="flex flex-col justify-between h-[280px]">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>D1 (매우 단단)</span>
                <span className="font-medium">40.2 N</span>
              </div>
              <div className="w-full bg-primary/10 h-4 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '90%' }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground">SD = 5.3 / 95% CI: 39.8-40.6</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>D2 (단단)</span>
                <span className="font-medium">35.7 N</span>
              </div>
              <div className="w-full bg-primary/10 h-4 rounded-full overflow-hidden">
                <div className="bg-primary/80 h-full rounded-full" style={{ width: '80%' }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground">SD = 4.8 / 95% CI: 35.4-36.0</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>D3 (보통)</span>
                <span className="font-medium">28.3 N</span>
              </div>
              <div className="w-full bg-primary/10 h-4 rounded-full overflow-hidden">
                <div className="bg-primary/60 h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground">SD = 6.2 / 95% CI: 27.9-28.7</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>D4 (무름)</span>
                <span className="font-medium">22.1 N</span>
              </div>
              <div className="w-full bg-primary/10 h-4 rounded-full overflow-hidden">
                <div className="bg-primary/40 h-full rounded-full" style={{ width: '50%' }}></div>
              </div>
              <p className="text-[10px] text-muted-foreground">SD = 7.1 / 95% CI: 21.6-22.6</p>
            </div>
          </div>
        </Card>

        {/* Chart 3: 부위별 GBR 시행률 */}
        <Card className="p-6 xl:col-span-2">
          <h3 className="font-medium mb-8">부위별 GBR(골이식) 시행률</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-48 text-sm text-right shrink-0">상악 구치부 (#16, #17)</div>
              <div className="grow relative bg-primary/10 h-6 rounded-full overflow-hidden">
                <div className="bg-primary h-full flex items-center justify-end px-3 text-white text-xs" style={{ width: '85%' }}>85%</div>
              </div>
              <div className="w-24 text-sm text-right shrink-0 text-muted-foreground">12,958 건</div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-48 text-sm text-right shrink-0">상악 전치부 (#11, #21)</div>
              <div className="grow relative bg-primary/10 h-6 rounded-full overflow-hidden">
                <div className="bg-primary/80 h-full flex items-center justify-end px-3 text-white text-xs" style={{ width: '62%' }}>62%</div>
              </div>
              <div className="w-24 text-sm text-right shrink-0 text-muted-foreground">9,451 건</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-48 text-sm text-right shrink-0">하악 구치부 (#36, #37)</div>
              <div className="grow relative bg-primary/10 h-6 rounded-full overflow-hidden">
                <div className="bg-primary/60 h-full flex items-center justify-end px-3 text-white text-xs" style={{ width: '48%' }}>48%</div>
              </div>
              <div className="w-24 text-sm text-right shrink-0 text-muted-foreground">7,317 건</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-48 text-sm text-right shrink-0">하악 전치부 (#31, #41)</div>
              <div className="grow relative bg-primary/10 h-6 rounded-full overflow-hidden">
                <div className="bg-primary/40 h-full flex items-center justify-end px-3 text-primary-darker text-xs font-medium" style={{ width: '28%' }}>28%</div>
              </div>
              <div className="w-24 text-sm text-right shrink-0 text-muted-foreground">4,267 건</div>
            </div>
          </div>
        </Card>

        {/* Chart 4: PHM 상관관계 및 치식 히트맵 */}
        <Card className="p-6 xl:col-span-1 border-neutral-200 bg-white">
          <h3 className="font-medium mb-4">PHM 상관관계 분석</h3>
          <p className="text-xs text-muted-foreground mb-6">연령별 당뇨 환자의 임플란트 수술 분포</p>
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="flex justify-between text-sm"><span>40-49세</span><span>18.5%</span></div>
              <div className="bg-primary/10 h-2 rounded-full overflow-hidden"><div className="bg-primary/60 h-full" style={{ width: '18.5%' }}></div></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm"><span>50-59세</span><span className="font-medium text-primary">34.2%</span></div>
              <div className="bg-primary/10 h-2 rounded-full overflow-hidden"><div className="bg-primary h-full" style={{ width: '34.2%' }}></div></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm"><span>60-69세</span><span>28.7%</span></div>
              <div className="bg-primary/10 h-2 rounded-full overflow-hidden"><div className="bg-primary/80 h-full" style={{ width: '28.7%' }}></div></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm"><span>70세 이상</span><span>18.6%</span></div>
              <div className="bg-primary/10 h-2 rounded-full overflow-hidden"><div className="bg-primary/40 h-full" style={{ width: '18.6%' }}></div></div>
            </div>
          </div>
          <div className="mt-8 bg-primary/5 border border-primary/20 p-4 text-xs text-primary-darker rounded-md flex gap-2 items-start">
            <Activity className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="leading-relaxed">50대 당뇨 환자군에서 임플란트 수술 빈도가 가장 높으며, 이는 치주질환 이환율 증가와 상관관계가 있음 (p &lt; 0.001)</p>
          </div>
        </Card>

        {/* Chart 5: 치식 히트맵 (Heatmap) */}
        <Card className="p-6 xl:col-span-1 border-neutral-200 bg-white">
          <h3 className="font-medium mb-4">치식 히트맵</h3>
          <p className="text-xs text-muted-foreground mb-6">임플란트 식립 빈도가 높은 치아 순위</p>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-primary text-white p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity">
              <div className="text-xs opacity-70">#36</div>
              <div className="text-lg font-bold">8,742</div>
              <div className="text-[10px] opacity-70 whitespace-nowrap">하악 제1대구치</div>
            </div>
            <div className="bg-primary/90 text-white p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity border border-primary/20">
              <div className="text-xs opacity-70">#46</div>
              <div className="text-lg font-bold">8,521</div>
              <div className="text-[10px] opacity-70 whitespace-nowrap">하악 제1대구치</div>
            </div>
            <div className="bg-primary/80 text-white p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity border border-primary/20">
              <div className="text-xs opacity-70">#16</div>
              <div className="text-lg font-bold">7,893</div>
              <div className="text-[10px] opacity-70 whitespace-nowrap">상악 제1대구치</div>
            </div>
            <div className="bg-primary/70 text-white p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity border border-primary/20">
              <div className="text-xs opacity-70">#26</div>
              <div className="text-lg font-bold">7,654</div>
              <div className="text-[10px] opacity-70 whitespace-nowrap">상악 제1대구치</div>
            </div>
            
            <div className="bg-primary/50 text-white p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity border border-primary/20">
              <div className="text-xs opacity-80">#37</div>
              <div className="text-lg font-bold">6,432</div>
              <div className="text-[10px] opacity-80 whitespace-nowrap">하악 제2대구치</div>
            </div>
            <div className="bg-primary/40 text-primary-darker p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity border border-primary/20">
              <div className="text-xs opacity-80">#47</div>
              <div className="text-lg font-bold">6,287</div>
              <div className="text-[10px] opacity-80 whitespace-nowrap">하악 제2대구치</div>
            </div>
            <div className="bg-primary/20 text-primary-darker p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity border border-primary/20">
              <div className="text-xs opacity-70">#17</div>
              <div className="text-lg font-bold">5,921</div>
              <div className="text-[10px] opacity-70 whitespace-nowrap">상악 제2대구치</div>
            </div>
            <div className="bg-primary/10 text-primary-darker p-4 rounded text-center aspect-square flex flex-col justify-center gap-1 hover:opacity-90 transition-opacity border border-primary/20">
              <div className="text-xs opacity-70">#27</div>
              <div className="text-lg font-bold">5,834</div>
              <div className="text-[10px] opacity-70 whitespace-nowrap">상악 제2대구치</div>
            </div>
          </div>
        </Card>

      </div>

      {/* Table Area */}
      <Card className="p-6 overflow-hidden">
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-medium">상세 데이터 테이블</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs"><FileText className="w-3 h-3 mr-2"/> Excel</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs"><FileText className="w-3 h-3 mr-2"/> CSV</Button>
          </div>
        </div>
        
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow>
                <TableHead className="w-[120px]">환자ID</TableHead>
                <TableHead>연령/성별</TableHead>
                <TableHead>치아번호</TableHead>
                <TableHead>골질</TableHead>
                <TableHead>초기고정력</TableHead>
                <TableHead>GBR</TableHead>
                <TableHead>픽스처 규격</TableHead>
                <TableHead>제조사</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-neutral-600">P-152847</TableCell>
                <TableCell>52세/F</TableCell>
                <TableCell>#16</TableCell>
                <TableCell><Badge variant="outline" className="text-primary-darker bg-primary/10 border-primary/20">D3</Badge></TableCell>
                <TableCell>28.5 N</TableCell>
                <TableCell><Badge className="bg-primary/10 text-primary-darker hover:bg-primary/20 border border-primary/20">Y</Badge></TableCell>
                <TableCell>Ø4.5 × 10mm</TableCell>
                <TableCell>Osstem</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-neutral-600">P-152848</TableCell>
                <TableCell>48세/M</TableCell>
                <TableCell>#36</TableCell>
                <TableCell><Badge variant="outline" className="text-primary bg-primary/20 border-primary/30 font-bold">D2</Badge></TableCell>
                <TableCell>35.2 N</TableCell>
                <TableCell><Badge variant="outline" className="bg-neutral-50 text-neutral-400 font-normal">N</Badge></TableCell>
                <TableCell>Ø4.0 × 11.5mm</TableCell>
                <TableCell>Straumann</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-neutral-600">P-152849</TableCell>
                <TableCell>56세/F</TableCell>
                <TableCell>#46</TableCell>
                <TableCell><Badge className="bg-primary/40 text-primary-foreground hover:bg-primary/50 border-none">D4</Badge></TableCell>
                <TableCell>21.8 N</TableCell>
                <TableCell><Badge className="bg-primary/10 text-primary-darker hover:bg-primary/20 border border-primary/20">Y</Badge></TableCell>
                <TableCell>Ø5.0 × 10mm</TableCell>
                <TableCell>Dentium</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-neutral-600">P-152850</TableCell>
                <TableCell>44세/M</TableCell>
                <TableCell>#26</TableCell>
                <TableCell><Badge variant="outline" className="text-primary bg-primary/20 border-primary/30 font-bold">D2</Badge></TableCell>
                <TableCell>36.7 N</TableCell>
                <TableCell><Badge className="bg-primary/10 text-primary-darker hover:bg-primary/20 border border-primary/20">Y</Badge></TableCell>
                <TableCell>Ø4.5 × 11.5mm</TableCell>
                <TableCell>Nobel Biocare</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-neutral-600">P-152851</TableCell>
                <TableCell>51세/F</TableCell>
                <TableCell>#17</TableCell>
                <TableCell><Badge variant="outline" className="text-primary-darker bg-primary/10 border-primary/20">D3</Badge></TableCell>
                <TableCell>27.3 N</TableCell>
                <TableCell><Badge className="bg-primary/10 text-primary-darker hover:bg-primary/20 border border-primary/20">Y</Badge></TableCell>
                <TableCell>Ø4.5 × 10mm</TableCell>
                <TableCell>Osstem</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Showing 1-5 of 152,430 cases</p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="w-8 h-8 opacity-50"><span className="text-xs">&lt;</span></Button>
            <Button variant="outline" size="icon" className="w-8 h-8 bg-primary text-white hover:bg-primary-darker hover:text-white border-primary"><span className="text-xs">1</span></Button>
            <Button variant="outline" size="icon" className="w-8 h-8 hover:bg-primary/5 hover:text-primary"><span className="text-xs">2</span></Button>
            <Button variant="outline" size="icon" className="w-8 h-8 hover:bg-primary/5 hover:text-primary"><span className="text-xs">3</span></Button>
            <div className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">...</div>
            <Button variant="outline" size="icon" className="w-auto px-3 h-8 hover:bg-primary/5 hover:text-primary"><span className="text-xs whitespace-nowrap">15,243</span></Button>
            <Button variant="outline" size="icon" className="w-8 h-8 hover:bg-primary/5 hover:text-primary"><span className="text-xs">&gt;</span></Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
