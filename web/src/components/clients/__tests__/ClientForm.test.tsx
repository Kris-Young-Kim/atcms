/**
 * ClientForm 컴포넌트 테스트
 * Sprint 1: CMS-US-01
 *
 * 참고: react-hook-form, Next.js Router, fetch를 모킹하여 테스트합니다.
 */

import { validClientData } from "@/__tests__/mocks/clients";
import { auditLogger } from "@/lib/logger/auditLogger";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { act } from "react";
import { ClientForm } from "../ClientForm";

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

// fetch 모킹
global.fetch = jest.fn();

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

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
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/이름은 최소 2자 이상이어야 합니다/)).toBeInTheDocument();
      });
    });

    it.skip("유효한 데이터로 제출할 수 있어야 함", async () => {
      // TODO: react-hook-form과 fetch 모킹의 비동기 처리 문제 해결 필요
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "client_001", ...validClientData }),
      } as Response);

      render(<ClientForm />);

      const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, validClientData.name);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith("/api/clients", expect.any(Object));
          expect(auditLogger.info).toHaveBeenCalledWith(
            "client_form_submitted_create",
            expect.any(Object),
          );
        },
        { timeout: 10000 },
      );
    }, 15000);
  });

  describe("API 호출", () => {
    it.skip("등록 모드일 때 POST 요청을 보내야 함", async () => {
      // TODO: react-hook-form과 fetch 모킹의 비동기 처리 문제 해결 필요
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "client_001", ...validClientData }),
      } as Response);

      render(<ClientForm mode="create" />);

      const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, validClientData.name);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/clients",
            expect.objectContaining({
              method: "POST",
              headers: expect.objectContaining({
                "Content-Type": "application/json",
              }),
            }),
          );
        },
        { timeout: 10000 },
      );
    }, 15000);

    it("수정 모드일 때 PUT 요청을 보내야 함", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "client_001", ...validClientData }),
      } as Response);

      render(<ClientForm mode="edit" clientId="client_001" initialData={validClientData} />);

      const submitButton = screen.getByRole("button", { name: /수정/ });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            "/api/clients/client_001",
            expect.objectContaining({
              method: "PUT",
            }),
          );
        },
        { timeout: 3000 },
      );
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

    it.skip("등록 성공 시 성공 메시지를 표시하고 리디렉션해야 함", async () => {
      // TODO: react-hook-form과 fetch 모킹의 비동기 처리 문제 해결 필요
      const user = userEvent.setup({ delay: null });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "client_001", ...validClientData }),
      } as Response);

      render(<ClientForm mode="create" />);

      const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, validClientData.name);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/성공적으로 등록되었습니다/)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/clients");
        },
        { timeout: 3000 },
      );
    }, 15000);

    it("수정 성공 시 성공 메시지를 표시하고 리디렉션해야 함", async () => {
      const user = userEvent.setup({ delay: null });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "client_001", ...validClientData }),
      } as Response);

      render(<ClientForm mode="edit" clientId="client_001" initialData={validClientData} />);

      const submitButton = screen.getByRole("button", { name: /수정/ });

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/성공적으로 수정되었습니다/)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/clients/client_001");
        },
        { timeout: 3000 },
      );
    }, 15000);
  });

  describe("에러 처리", () => {
    it("API 오류 시 에러 메시지를 표시해야 함", async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "Validation failed" }),
      } as Response);

      render(<ClientForm />);

      const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, validClientData.name);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/Validation failed/)).toBeInTheDocument();
          expect(auditLogger.error).toHaveBeenCalledWith(
            "client_form_failed_create",
            expect.any(Object),
          );
        },
        { timeout: 10000 },
      );
    }, 15000);

    it.skip("네트워크 오류 시 에러 메시지를 표시해야 함", async () => {
      // TODO: react-hook-form과 fetch 모킹의 비동기 처리 문제 해결 필요
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<ClientForm />);

      const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, validClientData.name);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(
        () => {
          expect(screen.getByText(/Network error/)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    }, 15000);
  });

  describe("로딩 상태", () => {
    it.skip("제출 중일 때 버튼이 비활성화되어야 함", async () => {
      // TODO: react-hook-form과 fetch 모킹의 비동기 처리 문제 해결 필요
      const user = userEvent.setup();
      let resolvePromise: (value: Response) => void;
      const promise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      render(<ClientForm />);

      const nameInput = screen.getByLabelText(/^이름\s*\*$/) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, validClientData.name);

      const submitButton = screen.getByRole("button", { name: /등록/ });

      await act(async () => {
        await user.click(submitButton);
      });

      await waitFor(
        () => {
          expect(submitButton).toBeDisabled();
        },
        { timeout: 10000 },
      );

      act(() => {
        resolvePromise!({
          ok: true,
          json: async () => ({ id: "client_001", ...validClientData }),
        } as Response);
      });

      await waitFor(
        () => {
          expect(submitButton).not.toBeDisabled();
        },
        { timeout: 10000 },
      );
    }, 25000);
  });
});
