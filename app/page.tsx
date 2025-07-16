import { generateEssay } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <header className="text-center mb-10 space-y-4 max-w-2xl">
        <h1 className="text-5xl font-serif font-bold">ChooGooMe</h1>
        <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
          당신의 생각이 흩어져 있다고 느껴졌던 순간,<br />
          사실은 하나의 이야기로 이어질 준비가 되어 있었을지 모릅니다.
        </p>
      </header>

      <form action={generateEssay} className="w-full max-w-2xl flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="font-medium">당신이 그동안 LinkedIn에 쓴 글들을 붙여 넣어주세요</span>
          <span className="text-sm text-gray-500">
            ChooGooMe가 그 모든 글을 하나의 이야기로 정리해 드릴게요.
          </span>
          <textarea
            name="posts"
            required
            rows={10}
            className="p-4 border rounded-md resize-vertical shadow-sm focus:outline-none focus:ring-2 focus:ring-black/40"
            placeholder={`예)\n✔ 조직 안의 전략 담당자에 대한 회의\n✔ 실행력 없는 리더와 사기꾼의 차이\n✔ 감정 설계의 중요성`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-medium">기억 암호 (생년월일)</span>
          <span className="text-sm text-gray-500">
            외부에 공개되지 않으며, 추후 글 복구에만 사용됩니다
          </span>
          <input
            type="text"
            name="birthdate"
            required
            placeholder="예: 1981-12-14"
            pattern="\d{4}-\d{2}-\d{2}"
            inputMode="numeric"
            className="p-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black/40"
          />
        </label>

        <SubmitButton />
      </form>

      <p className="text-sm text-gray-600 text-center max-w-xl mt-10 leading-relaxed">
        생각이 많았던 당신에게,<br />지금은 그 조각들을 이어볼 시간입니다.
      </p>
    </main>
  );
}
