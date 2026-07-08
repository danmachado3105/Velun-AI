"""
Extrator de texto de arquivos.

Cada tipo de arquivo (PDF, Word, texto simples) precisa de uma forma
diferente de leitura. Esta classe centraliza essa lógica, escondendo
os detalhes de cada biblioteca do resto do sistema.
"""

import io

import fitz  # PyMuPDF
from docx import Document


class UnsupportedFileTypeError(Exception):
    """Lançado quando o tipo de arquivo não é suportado."""
    pass


class TextExtractor:
    """Extrai texto de diferentes tipos de arquivo."""

    SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}

    def extract(self, filename: str, file_bytes: bytes) -> str:
        """Extrai o texto de um arquivo, de acordo com sua extensão."""
        extension = self._get_extension(filename)

        if extension == ".pdf":
            text = self._extract_from_pdf(file_bytes)
        elif extension == ".docx":
            text = self._extract_from_docx(file_bytes)
        elif extension in (".txt", ".md"):
            text = file_bytes.decode("utf-8", errors="ignore")
        else:
            raise UnsupportedFileTypeError(
                f"Tipo de arquivo não suportado: {extension}"
            )

        return self._truncate_if_needed(text)

    def _get_extension(self, filename: str) -> str:
        """Extrai a extensão do arquivo (ex: '.pdf'), em minúsculas."""
        return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    def _extract_from_pdf(self, file_bytes: bytes) -> str:
        """Extrai texto de todas as páginas de um PDF."""
        document = fitz.open(stream=file_bytes, filetype="pdf")
        pages_text = [page.get_text() for page in document]
        document.close()
        return "\n\n".join(pages_text)

    def _extract_from_docx(self, file_bytes: bytes) -> str:
        """Extrai texto de todos os parágrafos de um Word."""
        document = Document(io.BytesIO(file_bytes))
        paragraphs = [paragraph.text for paragraph in document.paragraphs]
        return "\n".join(paragraphs)

    MAX_CHARACTERS = 8000  # limite de segurança para não sobrecarregar o modelo local

    def _truncate_if_needed(self, text: str) -> str:
        """
        Limita o tamanho do texto extraído, para evitar sobrecarregar
        o modelo local (que roda no seu próprio computador, com
        recursos limitados de CPU/GPU).
        """
        if len(text) <= self.MAX_CHARACTERS:
            return text

        truncated = text[: self.MAX_CHARACTERS]
        return (
            truncated
            + "\n\n[... Texto truncado por limite de tamanho. "
            + f"O documento tem {len(text)} caracteres no total ...]"
        )