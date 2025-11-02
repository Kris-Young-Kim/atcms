/**
 * 기기 상태 차트 컴포넌트 (Stub)
 * Sprint 1: ERM-US-03
 *
 * 향후 실제 차트 라이브러리(Chart.js, Recharts 등)와 통합 예정
 */

export interface EquipmentStatusChartData {
  normal: number;
  maintenance: number;
  retired: number;
}

interface EquipmentStatusChartProps {
  data: EquipmentStatusChartData;
}

/**
 * 기기 상태 차트 컴포넌트 (Stub)
 * 
 * 현재는 간단한 통계 표시로 구현
 * 향후 Chart.js 또는 Recharts를 사용하여 실제 차트로 업그레이드 예정
 */
export function EquipmentStatusChart({ data }: EquipmentStatusChartProps) {
  const total = data.normal + data.maintenance + data.retired;

  if (total === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">기기 상태 통계</h3>
        <p className="text-gray-500 text-center py-8">데이터가 없습니다.</p>
      </div>
    );
  }

  const percentages = {
    normal: Math.round((data.normal / total) * 100),
    maintenance: Math.round((data.maintenance / total) * 100),
    retired: Math.round((data.retired / total) * 100),
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">기기 상태 통계</h3>
      
      {/* 간단한 막대 차트 Stub */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">정상</span>
            <span className="text-sm text-gray-600">{data.normal}개 ({percentages.normal}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-600 h-4 rounded-full transition-all"
              style={{ width: `${percentages.normal}%` }}
              aria-label={`정상: ${data.normal}개`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">유지보수</span>
            <span className="text-sm text-gray-600">{data.maintenance}개 ({percentages.maintenance}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-yellow-600 h-4 rounded-full transition-all"
              style={{ width: `${percentages.maintenance}%` }}
              aria-label={`유지보수: ${data.maintenance}개`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">폐기</span>
            <span className="text-sm text-gray-600">{data.retired}개 ({percentages.retired}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-red-600 h-4 rounded-full transition-all"
              style={{ width: `${percentages.retired}%` }}
              aria-label={`폐기: ${data.retired}개`}
            />
          </div>
        </div>
      </div>

      {/* 총계 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">전체</span>
          <span className="text-lg font-semibold text-gray-900">{total}개</span>
        </div>
      </div>

      {/* 향후 실제 차트로 업그레이드할 때 사용할 주석 */}
      {/* TODO: Chart.js 또는 Recharts를 사용하여 실제 차트로 업그레이드
          예시:
          - Bar Chart: 각 상태별 기기 수
          - Pie Chart: 상태별 비율
          - Line Chart: 시간대별 상태 변화 추이
      */}
    </div>
  );
}

