import unittest
import requests

BASE_URL = "http://localhost:8000/api"  # change if needed
ADMIN_LOGIN = {
    "name": "Admin",
    "password": "password123"
}

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}



class TestTeacherAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Login once before all tests"""
        print("\n[+] Logging in as Admin...")
        login_url = f"{BASE_URL}/login"

        response = requests.post(login_url, headers=headers, json=ADMIN_LOGIN)
        data = response.json()

        cls.token = data.get("token")
        assert cls.token is not None, "❌ Login failed, token not received"

        cls.auth_headers = {
            **headers,
            "Authorization": f"Bearer {cls.token}"
        }

        print("[+] Login successful!")

    # -------------------------------
    # TEST 1: Get Kuis Index
    # -------------------------------
    def test_01_get_kuis(self):
        url = f"{BASE_URL}/teacher/kuis"
        res = requests.get(url, headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)

    # -------------------------------
    # TEST 2: Create Kuis
    # -------------------------------
    def test_02_create_kuis(self):
        url = f"{BASE_URL}/teacher/kuis"
        payload = {
            "judul": "Kuis Test",
            "total_waktu": 120,
            "tampilkan_jawaban_benar": True,
            "tampilkan_peringkat": True
        }

        res = requests.post(url, headers=self.auth_headers, json=payload)
        self.assertEqual(res.status_code, 201)

        TestTeacherAPI.kuis_id = res.json().get("id")
        print(f"[+] Created kuis_id = {TestTeacherAPI.kuis_id}")

    # -------------------------------
    # TEST 3: Create Kuis With Questions
    # -------------------------------
    def test_03_create_kuis_with_questions(self):
        url = f"{BASE_URL}/teacher/kuis/full"
        payload = {
            "judul": "Kuis Full Test",
            "total_waktu": 200,
            "tampilkan_jawaban_benar": True,
            "tampilkan_peringkat": False,
            "pertanyaan": [
                {
                    "pertanyaan": "Siapa presiden Indonesia?",
                    "opsi_a": "Jokowi",
                    "opsi_b": "Prabowo",
                    "opsi_c": "Megawati",
                    "opsi_d": "Habibie",
                    "jawaban_benar": "a",
                    "url_gambar": None,
                    "persamaan_matematika": None
                }
            ]
        }

        res = requests.post(url, headers=self.auth_headers, json=payload)
        self.assertEqual(res.status_code, 201)

        TestTeacherAPI.kuis_full_id = res.json().get("kuis", {}).get("id")
        print(f"[+] Created kuis_full_id = {TestTeacherAPI.kuis_full_id}")

    # -------------------------------
    # TEST 4: Update Kuis
    # -------------------------------
    def test_04_update_kuis(self):
        url = f"{BASE_URL}/teacher/kuis/{self.kuis_id}"
        payload = {
            "judul": "Kuis Test Updated",
            "total_waktu": 300
        }

        res = requests.put(url, headers=self.auth_headers, json=payload)
        self.assertEqual(res.status_code, 200)

    # -------------------------------
    # TEST 5: Create Question
    # -------------------------------
    def test_05_create_question(self):
        url = f"{BASE_URL}/teacher/pertanyaan"
        payload = {
            "kuis_id": self.kuis_id,
            "pertanyaan": "2 + 2 = ?",
            "opsi_a": "3",
            "opsi_b": "4",
            "opsi_c": "5",
            "opsi_d": "6",
            "jawaban_benar": "b",
            "url_gambar": None,
            "persamaan_matematika": None
        }

        res = requests.post(url, headers=self.auth_headers, json=payload)
        self.assertEqual(res.status_code, 201)

        TestTeacherAPI.question_id = res.json().get("id")
        print(f"[+] Created question_id = {TestTeacherAPI.question_id}")

    # -------------------------------
    # TEST 6: Update Question
    # -------------------------------
    def test_06_update_question(self):
        url = f"{BASE_URL}/teacher/pertanyaan/{self.question_id}"
        payload = {
            "pertanyaan": "10 + 10 = ?",
            "opsi_b": "20",
            "jawaban_benar": "b"
        }

        res = requests.put(url, headers=self.auth_headers, json=payload)
        self.assertEqual(res.status_code, 200)

    # -------------------------------
    # TEST 7: Delete Question
    # -------------------------------
    def test_07_delete_question(self):
        url = f"{BASE_URL}/teacher/pertanyaan/{self.question_id}"
        res = requests.delete(url, headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)

    # -------------------------------
    # TEST 8: Delete Kuis
    # -------------------------------
    def test_08_delete_kuis(self):
        url = f"{BASE_URL}/teacher/kuis/{self.kuis_id}"
        res = requests.delete(url, headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)

    # -------------------------------
    # TEST 9: Delete Full Kuis
    # -------------------------------
    def test_09_delete_kuis_full(self):
        url = f"{BASE_URL}/teacher/kuis/{self.kuis_full_id}"
        res = requests.delete(url, headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
