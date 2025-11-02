/**
 * Toast 컴포넌트 테스트
 * Sprint 1: CMS-US-01
 */

import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { Toast, ToastContainer, useToast } from "../Toast";

describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("렌더링", () => {
    it("메시지를 표시해야 함", () => {
      const onClose = jest.fn();
      render(<Toast message="테스트 메시지" onClose={onClose} />);

      expect(screen.getByText("테스트 메시지")).toBeInTheDocument();
    });

    it("기본 타입(info)으로 렌더링되어야 함", () => {
      const onClose = jest.fn();
      render(<Toast message="정보 메시지" onClose={onClose} />);

      const toast = screen.getByRole("alert");
      expect(toast).toHaveClass("bg-blue-50");
      expect(screen.getByText("ⓘ")).toBeInTheDocument();
    });

    it("success 타입으로 렌더링되어야 함", () => {
      const onClose = jest.fn();
      render(<Toast message="성공 메시지" type="success" onClose={onClose} />);

      const toast = screen.getByRole("alert");
      expect(toast).toHaveClass("bg-emerald-50");
      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("error 타입으로 렌더링되어야 함", () => {
      const onClose = jest.fn();
      render(<Toast message="에러 메시지" type="error" onClose={onClose} />);

      const toast = screen.getByRole("alert");
      expect(toast).toHaveClass("bg-red-50");
      expect(screen.getByText("✕")).toBeInTheDocument();
    });
  });

  describe("자동 닫기", () => {
    it("지정된 시간 후 자동으로 닫혀야 함", async () => {
      const onClose = jest.fn();
      render(<Toast message="테스트 메시지" duration={1000} onClose={onClose} />);

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("기본 duration(3000ms)을 사용해야 함", async () => {
      const onClose = jest.fn();
      render(<Toast message="테스트 메시지" onClose={onClose} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("수동 닫기", () => {
    it("닫기 버튼 클릭 시 닫혀야 함", async () => {
      const onClose = jest.fn();
      render(<Toast message="테스트 메시지" onClose={onClose} />);

      const closeButton = screen.getByLabelText("닫기");

      act(() => {
        closeButton.click();
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});

describe("useToast", () => {
  beforeEach(() => {
    jest.useRealTimers();
  });

  it("toast를 추가할 수 있어야 함", async () => {
    function TestComponent() {
      const { toasts, showToast } = useToast();

      return (
        <div>
          <button onClick={() => showToast("테스트 메시지")}>Show Toast</button>
          <div data-testid="toast-count">{toasts.length}</div>
        </div>
      );
    }

    const { getByTestId, getByRole } = render(<TestComponent />);

    expect(getByTestId("toast-count")).toHaveTextContent("0");

    act(() => {
      const button = getByRole("button");
      button.click();
    });

    await waitFor(() => {
      expect(getByTestId("toast-count")).toHaveTextContent("1");
    });
  });

  it("toast를 제거할 수 있어야 함", async () => {
    function TestComponent() {
      const { toasts, showToast, removeToast } = useToast();

      return (
        <div>
          <button onClick={() => showToast("테스트 메시지")}>Show Toast</button>
          <button onClick={() => removeToast(toasts[0]?.id || 0)}>Remove Toast</button>
          <div data-testid="toast-count">{toasts.length}</div>
        </div>
      );
    }

    const { getByTestId, getAllByRole } = render(<TestComponent />);

    act(() => {
      const buttons = getAllByRole("button");
      buttons[0].click(); // Show Toast
    });

    await waitFor(() => {
      expect(getByTestId("toast-count")).toHaveTextContent("1");
    });

    act(() => {
      const buttons = getAllByRole("button");
      buttons[1].click(); // Remove Toast
    });

    await waitFor(() => {
      expect(getByTestId("toast-count")).toHaveTextContent("0");
    });
  });

  it("success, error, info 헬퍼 함수가 작동해야 함", async () => {
    function TestComponent() {
      const { toasts, success, error, info } = useToast();

      return (
        <div>
          <button onClick={() => success("성공")}>Success</button>
          <button onClick={() => error("에러")}>Error</button>
          <button onClick={() => info("정보")}>Info</button>
          <div data-testid="toast-count">{toasts.length}</div>
          {toasts.map((toast, index) => (
            <div key={toast.id} data-testid={`toast-${index}`}>
              {toast.message} - {toast.type}
            </div>
          ))}
        </div>
      );
    }

    const { getByTestId, getAllByRole } = render(<TestComponent />);

    const buttons = getAllByRole("button");

    act(() => {
      buttons[0].click(); // Success
    });

    await waitFor(() => {
      expect(getByTestId("toast-0")).toHaveTextContent("성공 - success");
    });

    act(() => {
      buttons[1].click(); // Error
    });

    await waitFor(() => {
      expect(getByTestId("toast-1")).toHaveTextContent("에러 - error");
    });

    act(() => {
      buttons[2].click(); // Info
    });

    await waitFor(() => {
      expect(getByTestId("toast-2")).toHaveTextContent("정보 - info");
      expect(getByTestId("toast-count")).toHaveTextContent("3");
    });
  });
});

describe("ToastContainer", () => {
  it("여러 toast를 렌더링해야 함", () => {
    const toasts = [
      { id: 1, message: "첫 번째 메시지", type: "success" as const },
      { id: 2, message: "두 번째 메시지", type: "error" as const },
    ];

    const onRemove = jest.fn();

    render(<ToastContainer toasts={toasts} onRemove={onRemove} />);

    expect(screen.getByText("첫 번째 메시지")).toBeInTheDocument();
    expect(screen.getByText("두 번째 메시지")).toBeInTheDocument();
  });

  it("빈 배열일 때 아무것도 렌더링하지 않아야 함", () => {
    const onRemove = jest.fn();

    const { container } = render(<ToastContainer toasts={[]} onRemove={onRemove} />);

    expect(container.firstChild).toBeNull();
  });
});
