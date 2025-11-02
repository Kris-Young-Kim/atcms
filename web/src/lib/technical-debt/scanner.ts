/**
 * 기술 부채 스캐너
 * 
 * 코드베이스에서 기술 부채를 자동으로 감지하는 유틸리티입니다.
 */

/**
 * 기술 부채 유형
 */
export type TechnicalDebtType = "architecture" | "code" | "documentation" | "dependency" | "infrastructure";

/**
 * 기술 부채 우선순위
 */
export type TechnicalDebtPriority = "P0" | "P1" | "P2" | "P3";

/**
 * 기술 부채 항목
 */
export interface TechnicalDebtItem {
  id: string;
  type: TechnicalDebtType;
  priority: TechnicalDebtPriority;
  title: string;
  description: string;
  file?: string;
  line?: number;
  foundDate: Date;
  assignee?: string;
  status: "open" | "in_progress" | "resolved";
  relatedIssue?: string;
}

/**
 * 기술 부채 스캐너
 * 
 * 코드베이스에서 기술 부채를 찾고 분석합니다.
 */
export class TechnicalDebtScanner {
  private debts: TechnicalDebtItem[] = [];

  /**
   * TODO 주석에서 기술 부채 찾기
   * 
   * @param content - 파일 내용
   * @param filePath - 파일 경로
   */
  scanTodoComments(content: string, filePath: string): TechnicalDebtItem[] {
    const todoRegex = /TODO\(TECH-DEBT\):\s*\[(P[0-3])\]\s*(.+)/g;
    const matches = Array.from(content.matchAll(todoRegex));
    const lineNumbers = content.split("\n");

    return matches.map((match, index) => {
      const lineNumber = lineNumbers.slice(0, match.index).join("\n").split("\n").length + 1;

      return {
        id: `${filePath}-todo-${index}`,
        type: "code" as TechnicalDebtType,
        priority: match[1] as TechnicalDebtPriority,
        title: match[2].trim(),
        description: match[2].trim(),
        file: filePath,
        line: lineNumber,
        foundDate: new Date(),
        status: "open" as const,
      };
    });
  }

  /**
   * 기술 부채 리포트 생성
   */
  generateReport(): {
    total: number;
    byPriority: Record<TechnicalDebtPriority, number>;
    byType: Record<TechnicalDebtType, number>;
  } {
    const byPriority: Record<TechnicalDebtPriority, number> = {
      P0: 0,
      P1: 0,
      P2: 0,
      P3: 0,
    };

    const byType: Record<TechnicalDebtType, number> = {
      architecture: 0,
      code: 0,
      documentation: 0,
      dependency: 0,
      infrastructure: 0,
    };

    this.debts.forEach((debt) => {
      byPriority[debt.priority]++;
      byType[debt.type]++;
    });

    return {
      total: this.debts.length,
      byPriority,
      byType,
    };
  }
}

/**
 * 기술 부채 추적기
 * 
 * 기술 부채를 중앙에서 관리합니다.
 */
export class TechnicalDebtTracker {
  private debts: Map<string, TechnicalDebtItem> = new Map();

  /**
   * 기술 부채 추가
   */
  add(debt: TechnicalDebtItem): void {
    this.debts.set(debt.id, debt);
  }

  /**
   * 기술 부채 조회
   */
  get(id: string): TechnicalDebtItem | undefined {
    return this.debts.get(id);
  }

  /**
   * 우선순위별 조회
   */
  getByPriority(priority: TechnicalDebtPriority): TechnicalDebtItem[] {
    return Array.from(this.debts.values()).filter((debt) => debt.priority === priority);
  }

  /**
   * 상태별 조회
   */
  getByStatus(status: TechnicalDebtItem["status"]): TechnicalDebtItem[] {
    return Array.from(this.debts.values()).filter((debt) => debt.status === status);
  }
}

// 싱글톤 인스턴스
export const technicalDebtTracker = new TechnicalDebtTracker();

