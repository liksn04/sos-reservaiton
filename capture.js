import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Roomin 전면적인 UI/UX 일관성 검증용 통합 캡처 스크립트
 * 
 * [방어한 엣지 케이스 3가지]
 * 1. (인증 플로우 예외) 로그인 페이지에서 게스트 로그인 버튼이 나타나지 않거나 이미 로그인되어 세션이 활성화된 경우에 대한 분기 처리.
 * 2. (비정상 라우트 및 권한 차단) 특정 서브페이지 진입 권한이 부족하여 메인으로 자동 리다이렉트되는 현상이 있을 시, 캡처 파일 이름에 리다이렉트 여부를 로깅 처리.
 * 3. (동적 렌더링 지연) Framer motion 등 화면 전환 및 Supabase API 연동 지연으로 인한 빈 화면 캡처 방지용 스마트 대기 로직 구현.
 */
async function runVerification() {
  const url = 'http://localhost:5150';
  const outputDir = '/Users/liksn04/.gemini/antigravity/brain/0847007d-60e9-4503-a6bf-7090cc8b2fa7/scratch';

  // 1. 디렉토리 검증
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  } catch (err) {
    console.error('[Error] 디렉토리 준비 실패:', err.message);
    process.exit(1);
  }

  let browser;
  try {
    console.log('[Info] Puppeteer 브라우저 시작...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 1단계: 접속 및 게스트 로그인
    console.log(`[Info] ${url} 접속 중...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    } catch (err) {
      console.error('[Error] 서버 미구동 상태:', err.message);
      await browser.close();
      process.exit(1);
    }

    // 엣지 케이스 1 방어: 게스트 로그인 버튼 탐색 및 존재할 때만 클릭 처리
    const guestBtnSelector = '.roomin-login-guest-button';
    const hasGuestBtn = await page.$(guestBtnSelector);
    if (hasGuestBtn) {
      console.log('[Info] 게스트 로그인 진행...');
      await page.click(guestBtnSelector);
      // 로그인 처리 후 메인 페이지 리다이렉션 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('[Info] 게스트 로그인 버튼이 감지되지 않았습니다. 이미 로그인 상태거나 메인 화면입니다.');
    }

    // 로컬 스토리지에 테마를 설정하여 검증하는 헬퍼 함수
    const setAppTheme = async (themeType) => {
      await page.evaluate((theme) => {
        localStorage.setItem('roomin-theme', theme);
      }, themeType);
      // 테마를 확실하게 변경하고 DOM 구조에 반영되도록 리로드
      await page.reload({ waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 1500));
    };

    // 테스트할 주요 화면 리스트
    const targetPages = [
      { name: 'reserve', path: '/' },
      { name: 'events', path: '/events' },
      { name: 'admin', path: '/admin' },
      { name: 'budget', path: '/budget' }
    ];

    const viewports = [
      { type: 'mobile', width: 390, height: 844, isMobile: true },
      { type: 'desktop', width: 1280, height: 800, isMobile: false }
    ];

    // 두 가지 테마 모두 점검
    const themes = ['dark', 'light'];

    for (const theme of themes) {
      console.log(`\n--- [테마: ${theme.toUpperCase()}] 검증 시작 ---`);
      await setAppTheme(theme);

      for (const target of targetPages) {
        console.log(`[Info] 페이지 이동: ${url}${target.path}`);
        
        try {
          await page.goto(`${url}${target.path}`, { waitUntil: 'networkidle2', timeout: 10000 });
        } catch (gotoErr) {
          console.error(`[Warning] ${target.name} 페이지로의 이동이 실패했거나 지연되었습니다:`, gotoErr.message);
        }

        // 엣지 케이스 3 방어: 동적 렌더링 및 모션 애니메이션 안정화를 위해 1.5초 추가 대기
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 엣지 케이스 2 방어: 현재 렌더링된 실제 URL을 체크하여 권한 부족으로 리다이렉트 되었는지 검출
        const currentUrl = page.url();
        const expectedUrl = `${url}${target.path === '/' ? '' : target.path}`;
        const isRedirected = currentUrl !== expectedUrl && currentUrl !== `${expectedUrl}/`;
        const prefix = isRedirected ? `redirected_from_${target.name}` : target.name;

        if (isRedirected) {
          console.log(`[Warning] 권한 부족 또는 리다이렉트 발생: ${expectedUrl} -> ${currentUrl}`);
        }

        for (const vp of viewports) {
          await page.setViewport({
            width: vp.width,
            height: vp.height,
            deviceScaleFactor: 2,
            isMobile: vp.isMobile,
            hasTouch: vp.isMobile
          });
          
          await new Promise(resolve => setTimeout(resolve, 500));

          const filename = `verify_${prefix}_${theme}_${vp.type}.png`;
          const filepath = path.join(outputDir, filename);
          
          await page.screenshot({ path: filepath });
          console.log(`[Success] 캡처 완료: ${filename}`);
        }
      }
    }

  } catch (error) {
    console.error('[Error] 검증 시나리오 진행 중 치명적 결함 발생:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('[Info] 브라우저 세션을 성공적으로 닫았습니다.');
    }
  }
}

runVerification();
