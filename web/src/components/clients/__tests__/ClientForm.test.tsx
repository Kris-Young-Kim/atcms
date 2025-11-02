/**
 * ClientForm 컴포넌트 테스트
 * Sprint 1: CMS-US-01
 *
 * 참고: react-hook-form, Next.js Router, fetch를 모킹하여 테스트합니다.
 */

import { validClientData } from "@/__tests__/mocks/clients";
import { auditLogger } from "@/lib/logger/auditLogger";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { ClientForm } from "../ClientForm";

interface MockFetchOptions {
  ok?: boolean;
  status?: number;
}

// Next.js Router 모킹
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// auditLogger 모킹
jest.mock("@/lib/logger/auditLogger", () => ({
  auditLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockToastApi = {
  toasts: [] as Array<{ id: number; message: string; type: "success" | "error" | "info" }>,
  removeToast: jest.fn(),
  showToast: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

const reactActWarning = "The current testing environment is not configured to support act";
const originalConsoleError = console.error;

beforeAll(() => {
  jest
    .spyOn(console, "error")
    .mockImplementation((message?: unknown, ...optionalParams: unknown[]) => {
      if (typeof message === "string" && message.includes(reactActWarning)) {
        return;
      }

      originalConsoleError(message as string, ...optionalParams);
    });
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

// Toast 컴포넌트/훅 모킹 (테스트 시 act 경고 제거용)
jest.mock("@/components/ui/Toast", () => ({
  ToastContainer: () => null,
  useToast: () => mockToastApi,
}));

// fetch 모킹
global.fetch = jest.fn();

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const createFetchResponse = <TData,>(
  data: TData,
  { ok = true, status = ok ? 200 : 400 }: MockFetchOptions = {},
) =>
  ({
    ok,
    status,
    json: async () => data,
  }) as Response;

async function clickWithAct(user: ReturnType<typeof userEvent.setup>, element: HTMLElement) {
  await act(async () => {
    await user.click(element);
  });
}

async function fillClientForm(
  user: ReturnType<typeof userEvent.setup>,
  data: Partial<typeof validClientData> = {},
) {
  const formData = { ...validClientData, ...data };

  const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
  await user.clear(nameInput);
  await user.type(nameInput, formData.name);

  const birthDateInput = screen.getByLabelText(/생년월일/) as HTMLInputElement;
  await act(async () => {
    fireEvent.change(birthDateInput, { target: { value: formData.birth_date } });
  });

  const genderSelect = screen.getByLabelText(/성별/) as HTMLSelectElement;
  await user.selectOptions(genderSelect, formData.gender ?? "male");

  const phoneInput = screen.getByLabelText(/전화번호/) as HTMLInputElement;
  await user.clear(phoneInput);
  await user.type(phoneInput, formData.contact_phone ?? "010-0000-0000");

  const emailInput = screen.getByLabelText(/이메일/) as HTMLInputElement;
  await user.clear(emailInput);
  await user.type(emailInput, formData.contact_email ?? "test@example.com");

  const addressInput = screen.getByLabelText(/주소/) as HTMLInputElement;
  await user.clear(addressInput);
  await user.type(addressInput, formData.address ?? "서울시 테스트");
}

describe("ClientForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
    mockFetch.mockReset();
    mockToastApi.toasts = [];
    mockToastApi.removeToast.mockReset();
    mockToastApi.showToast.mockReset();
    mockToastApi.success.mockReset();
    mockToastApi.error.mockReset();
    mockToastApi.info.mockReset();
  });

  describe("렌더링", () => {
    it("폼이 렌더링되어야 함", () => {
      render(<ClientForm />);

      expect(screen.getByLabelText(/^이름/)).toBeInTheDocument();
      expect(screen.getByLabelText(/생년월일/)).toBeInTheDocument();
      expect(screen.getByLabelText(/성별/)).toBeInTheDocument();
    });

    it("등록 모드일 때 제출 버튼 텍스트가 올바르게 표시되어야 함", () => {
      render(<ClientForm mode="create" />);

      const submitButton = screen.getByRole("button", { name: /등록/ });
      expect(submitButton).toBeInTheDocument();
    });

    it("수정 모드일 때 제출 버튼 텍스트가 올바르게 표시되어야 함", () => {
      render(<ClientForm mode="edit" clientId="client_001" />);

      const submitButton = screen.getByRole("button", { name: /수정/ });
      expect(submitButton).toBeInTheDocument();
    });

    it("initialData가 있으면 기본값으로 채워져야 함", () => {
      render(<ClientForm initialData={validClientData} />);

      const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
      expect(nameInput.value).toBe(validClientData.name);
    });
  });

  describe("폼 검증", () => {
    it("이름이 없으면 에러 메시지를 표시해야 함", async () => {
      const user = userEvent.setup();
      render(<ClientForm />);

      const submitButton = screen.getByRole("button", { name: /등록/ });
      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(screen.getByText(/이름은 최소 2자 이상이어야 합니다/)).toBeInTheDocument();
      });
    });

    it("유효한 데이터로 제출할 수 있어야 함", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({ id: "client_001", ...validClientData }),
      );

      render(<ClientForm />);

      await fillClientForm(user);

      const submitButton = screen.getByRole("button", { name: /등록/ });
      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/clients", expect.any(Object));
        expect(auditLogger.info).toHaveBeenCalledWith(
          "client_form_submitted_create",
          expect.any(Object),
        );
      });
    });
  });

  describe("API 호출", () => {
    it("등록 모드일 때 POST 요청을 보내야 함", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({ id: "client_001", ...validClientData }),
      );

      render(<ClientForm mode="create" />);

      await fillClientForm(user);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/clients",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
          }),
        );
      });
    });

    it("수정 모드일 때 PUT 요청을 보내야 함", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({ id: "client_001", ...validClientData }),
      );

      render(<ClientForm mode="edit" clientId="client_001" initialData={validClientData} />);

      const submitButton = screen.getByRole("button", { name: /수정/ });
      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/clients/client_001",
          expect.objectContaining({
            method: "PUT",
          }),
        );
      });
    });
  });

  describe("성공 처리", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it("등록 성공 시 성공 메시지를 표시하고 리디렉션해야 함", async () => {
      const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({ id: "client_001", ...validClientData }),
      );

      render(<ClientForm mode="create" />);

      await fillClientForm(user);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(mockToastApi.success).toHaveBeenCalledWith("대상자가 성공적으로 등록되었습니다.");
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/clients");
      });
    });

    it("수정 성공 시 성공 메시지를 표시하고 리디렉션해야 함", async () => {
      const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({ id: "client_001", ...validClientData }),
      );

      render(<ClientForm mode="edit" clientId="client_001" initialData={validClientData} />);

      const submitButton = screen.getByRole("button", { name: /수정/ });

      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(mockToastApi.success).toHaveBeenCalledWith(
          "대상자 정보가 성공적으로 수정되었습니다.",
        );
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/clients/client_001");
      });
    });
  });

  describe("에러 처리", () => {
    it("API 오류 시 에러 메시지를 표시해야 함", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce(
        createFetchResponse({ error: "Validation failed" }, { ok: false, status: 400 }),
      );

      render(<ClientForm />);

      await fillClientForm(user);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(mockToastApi.error).toHaveBeenCalledWith("Validation failed");
        expect(auditLogger.error).toHaveBeenCalledWith(
          "client_form_failed_create",
          expect.any(Object),
        );
      });
    });

    it("네트워크 오류 시 에러 메시지를 표시해야 함", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<ClientForm />);

      await fillClientForm(user);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(mockToastApi.error).toHaveBeenCalledWith("Network error");
      });
    });
  });

  describe("로딩 상태", () => {
    it("제출 중일 때 버튼이 비활성화되어야 함", async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Response) => void;
      const pendingResponse = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(pendingResponse);

      render(<ClientForm />);

      await fillClientForm(user);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await clickWithAct(user, submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      act(() => {
        resolvePromise!(createFetchResponse({ id: "client_001", ...validClientData }));
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});
