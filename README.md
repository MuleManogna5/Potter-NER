# Potter-NER

Potter-NER is a **Named Entity Recognition (NER)** project built using **Natural Language Processing (NLP)** techniques.  
The project uses a **FastAPI backend with spaCy** for entity extraction and a **React (Vite) frontend** for user interaction.

It identifies entities such as **PERSON, LOCATION, ORGANIZATION**, etc., from user-provided text and returns structured results through an API.

---

##  What is Named Entity Recognition (NER)?
Named Entity Recognition (NER) is an NLP task that identifies and classifies key entities in text into predefined categories such as:
- PERSON
- LOCATION
- ORGANIZATION

NER is commonly used in **information extraction, document analysis, chatbots, and search engines**.

---

##  Project Features
- Named Entity Recognition using **spaCy**
- REST API built with **FastAPI**
- React-based frontend using **Vite**
- Cleaned CSV and JSONL datasets
- API health check endpoint
- CORS enabled for frontend-backend communication

---

## Tech Stack

### Backend
- Python
- FastAPI
- spaCy
- Uvicorn

### Frontend
- React
- Vite
- JavaScript
- HTML, CSS

---

## Project Structure
POTTER-NER/
│── app.py
│
│── dataset/
│   ├── assembled_parsed_dataset.csv
│   ├── cleaned_for_ner.csv
│   ├── conversion_problems.jsonl
│   ├── preview_with_entities.jsonl
│   └── spacy_train.jsonl
│
│── ner-ui/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── eslint.config.js
│   ├── vite.config.js
│   └── README.md
│
│── README.md


## How to Run the Project

### Backend (FastAPI)

###  Backend (FastAPI)

1. Open terminal in project folder
```bash
cd POTTER-NER
pip install fastapi uvicorn spacy
Run the backend server

bash
Copy code
python app.py
Backend will start at:

arduino
Copy code
http://localhost:8000
Health check endpoint:

bash
Copy code
http://localhost:8000/health
yaml
Copy code

---

#### Frontend
```md
### Frontend (React UI)

1. Move to frontend folder
```bash
cd ner-ui
Install dependencies

npm install


Start development server

npm run dev


Open the browser URL shown in terminal.


---

### 3️ Example Input / Output (paste LAST)

```md
##  Example Input

Harry Potter studies at Hogwarts in London.

## Example Output

{
  "entities": [
    { "text": "Harry Potter", "label": "PERSON" },
    { "text": "Hogwarts", "label": "ORG" },
    { "text": "London", "label": "GPE" }
  ]
}

##  Author

**Manogna Mule**  
BTech Student  
Interested in Web Development, and UI/UX  

GitHub: https://github.com/MuleManogna5
