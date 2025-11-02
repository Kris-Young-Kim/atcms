#!/usr/bin/env node

/**
 * 주간 성능 지표 리포트 생성 스크립트
 * 
 * GitHub API를 통해 지표 데이터를 수집하고 주간 리포트를 생성합니다.
 * 
 * 사용법:
 *   node scripts/generate-metrics-report.js
 * 
 * 환경 변수:
 *   GITHUB_TOKEN: GitHub API 토큰
 *   SLACK_WEBHOOK_URL: Slack 웹훅 URL (선택사항)
 */

const fs = require('fs');
const path = require('path');

// GitHub API 클라이언트 (간단한 구현)
async function fetchGitHubData(endpoint) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN 환경 변수가 설정되지 않았습니다.');
  }

  const url = `https://api.github.com${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API 오류: ${response.statusText}`);
  }

  return response.json();
}

// 날짜 포맷팅
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// 주간 리포트 생성
async function generateWeeklyReport() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const reportDate = formatDate(today);
  const weekStart = formatDate(weekAgo);
  const weekEnd = formatDate(today);

  console.log(`📊 주간 성능 지표 리포트 생성 중... (${weekStart} ~ ${weekEnd})`);

  try {
    // 리포지토리 정보 가져오기 (환경 변수 또는 git config에서)
    const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || 'OWNER';
    const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'REPO';
    const repoPath = `/repos/${repoOwner}/${repoName}`;

    // 1. PR 통계 수집
    const prs = await fetchGitHubData(`${repoPath}/pulls?state=all&per_page=100`);
    const mergedPRs = prs.filter(pr => pr.merged_at && new Date(pr.merged_at) >= weekAgo);
    const openPRs = prs.filter(pr => pr.state === 'open');

    // PR 머지 시간 계산
    const mergeTimes = mergedPRs.map(pr => {
      const createdAt = new Date(pr.created_at);
      const mergedAt = new Date(pr.merged_at);
      return (mergedAt - createdAt) / (1000 * 60 * 60); // 시간 단위
    });
    const avgMergeTime = mergeTimes.length > 0
      ? (mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length).toFixed(1)
      : 0;

    // 2. 이슈 통계 수집
    const issues = await fetchGitHubData(`${repoPath}/issues?state=all&per_page=100`);
    const blockerIssues = issues.filter(issue =>
      issue.labels.some(label => label.name === 'blocker' || label.name === 'priority: P0')
    );

    // 3. 커밋 통계 수집
    const commits = await fetchGitHubData(
      `${repoPath}/commits?since=${weekStart}T00:00:00Z&until=${weekEnd}T23:59:59Z&per_page=100`
    );

    // 4. 리포트 생성
    const report = `# 주간 성능 지표 리포트

**프로젝트 코드**: ATCMP-2026  
**리포트 기간**: ${weekStart} ~ ${weekEnd}  
**생성일**: ${reportDate}  
**생성자**: GitHub Actions (자동 생성)

---

## 📊 요약

### 개발 생산성

- **머지된 PR 수**: ${mergedPRs.length}개
- **평균 PR 머지 시간**: ${avgMergeTime}시간
- **진행 중인 PR 수**: ${openPRs.length}개
- **주간 커밋 수**: ${commits.length}개

### 제품 품질

- **에러 발생**: [모니터링 도구에서 수집 필요]
- **가동률**: [모니터링 도구에서 수집 필요]
- **응답 시간**: [모니터링 도구에서 수집 필요]

### 팀 건강도

- **블로커 이슈**: ${blockerIssues.length}개
- **코드 리뷰 시간**: [GitHub API에서 계산 필요]
- **스프린트 완료율**: [수동 입력 필요]

---

## 🔍 상세 분석

### PR 통계

#### 머지된 PR 목록

${mergedPRs.slice(0, 10).map(pr => `- #${pr.number}: ${pr.title} (${formatDate(new Date(pr.merged_at))})`).join('\n')}

${mergedPRs.length > 10 ? `\n... 외 ${mergedPRs.length - 10}개 PR` : ''}

#### PR 머지 시간 분석

- **최소 시간**: ${Math.min(...mergeTimes).toFixed(1)}시간
- **최대 시간**: ${Math.max(...mergeTimes).toFixed(1)}시간
- **평균 시간**: ${avgMergeTime}시간
- **목표 달성**: ${avgMergeTime < 48 ? '✅' : '❌'} (목표: < 48시간)

---

### 이슈 통계

#### 블로커 이슈

${blockerIssues.length > 0
  ? blockerIssues.map(issue => `- #${issue.number}: ${issue.title} (${issue.state})`).join('\n')
  : '- 블로커 이슈 없음 ✅'}

---

### 커밋 통계

- **주간 커밋 수**: ${commits.length}개
- **평균 일일 커밋**: ${(commits.length / 7).toFixed(1)}개

---

## 📈 트렌드 분석

### PR 머지 시간 트렌드

${avgMergeTime < 48 ? '✅ 개선 중' : '⚠️ 개선 필요'}

### 블로커 이슈 트렌드

${blockerIssues.length === 0 ? '✅ 블로커 이슈 없음' : '⚠️ 블로커 이슈 존재'}

---

## 🎯 목표 달성 평가

| 지표 | 목표 | 실제 | 달성 여부 |
|------|------|------|----------|
| PR 머지 시간 | < 48시간 | ${avgMergeTime}시간 | ${avgMergeTime < 48 ? '✅' : '❌'} |
| 블로커 이슈 | 0개 | ${blockerIssues.length}개 | ${blockerIssues.length === 0 ? '✅' : '❌'} |
| 코드 커버리지 | 70% 이상 | [CI에서 수집 필요] | - |
| 에러율 | < 0.5% | [모니터링에서 수집 필요] | - |

---

## 💡 개선 권장 사항

${avgMergeTime >= 48 ? '- PR 머지 시간 개선 필요: 평균 ' + avgMergeTime + '시간 (목표: < 48시간)\n' : ''}${blockerIssues.length > 0 ? '- 블로커 이슈 해결 필요: ' + blockerIssues.length + '개\n' : ''}${avgMergeTime < 48 && blockerIssues.length === 0 ? '- 모든 지표가 목표를 달성했습니다! 👍\n' : ''}

---

## 📝 참고

이 리포트는 GitHub Actions를 통해 자동 생성되었습니다.  
상세한 지표는 각 지표 문서를 참고하세요:

- [개발 생산성 지표](./docs/developer-productivity-metrics.md)
- [제품 품질 지표](./docs/product-quality-metrics.md)
- [팀 건강도 지표](./docs/team-health-metrics.md)

---

**생성 시간**: ${new Date().toISOString()}
`;

    // 리포트 파일 저장
    const reportFileName = `metrics-report-${reportDate}.md`;
    const reportPath = path.join(process.cwd(), reportFileName);
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`✅ 리포트 생성 완료: ${reportFileName}`);

    // Slack 알림 (선택사항)
    if (process.env.SLACK_WEBHOOK_URL) {
      const slackMessage = {
        text: `📊 주간 성능 지표 리포트 (${weekStart} ~ ${weekEnd})`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `📊 주간 성능 지표 리포트`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*기간*\n${weekStart} ~ ${weekEnd}`,
              },
              {
                type: 'mrkdwn',
                text: `*머지된 PR*\n${mergedPRs.length}개`,
              },
              {
                type: 'mrkdwn',
                text: `*평균 머지 시간*\n${avgMergeTime}시간`,
              },
              {
                type: 'mrkdwn',
                text: `*블로커 이슈*\n${blockerIssues.length}개`,
              },
            ],
          },
        ],
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });

      console.log('✅ Slack 알림 전송 완료');
    }

    return reportFileName;
  } catch (error) {
    console.error('❌ 리포트 생성 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  generateWeeklyReport()
    .then(() => {
      console.log('✅ 리포트 생성 프로세스 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { generateWeeklyReport };

