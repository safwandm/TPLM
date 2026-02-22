

// Fisher–Yates shuffle (pure function)
export function shuffleArray(array) {
    if (!Array.isArray(array)) return array;
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/*
  shuffleQuestionOptions(question)

  WHY THIS FILE EXISTS
  --------------------
  The backend stores answers using ORIGINAL indices.
  The frontend SHUFFLES options to prevent cheating.

  That creates TWO index spaces:
  - ORIGINAL index (backend truth)
  - SHUFFLED index (what the student sees)

  To keep both worlds in sync, we attach a mapping:

    _optionIndexMap
    shuffledIndex -> originalIndex

  This mapping is used later when:
  - submitting answers
  - restoring session
  - showing correct answers

  This file is PURE LOGIC (no React). It belongs in utils.
*/
export function shuffleQuestionOptions(question) {
    if (!question?.opsi) return question;

    // ================= MULTIPLE CHOICE + ORDERING =================
    if (Array.isArray(question.opsi)) {
        const original = question.opsi.map((text, index) => ({
            text,
            originalIndex: index,
        }));

        const shuffled = shuffleArray(original);

        // map shuffledIndex -> originalIndex
        const reverseMap = {};
        shuffled.forEach((item, newIndex) => {
            reverseMap[newIndex] = item.originalIndex;
        });

        return {
            ...question,
            opsi: shuffled.map(s => s.text),
            _optionIndexMap: reverseMap,
        };
    }

    // ================= MATCHING (shuffle RIGHT column only) =================
    if (question.tipe_pertanyaan === "matching" && question.opsi.kanan) {
        const kananOriginal = question.opsi.kanan.map((text, index) => ({
            text,
            originalIndex: index,
        }));

        const kananShuffled = shuffleArray(kananOriginal);

        const reverseMap = {};
        kananShuffled.forEach((item, newIndex) => {
            reverseMap[newIndex] = item.originalIndex;
        });

        return {
            ...question,
            opsi: {
                ...question.opsi,
                kanan: kananShuffled.map(k => k.text),
            },
            _optionIndexMap: reverseMap,
        };
    }

    return question;
}