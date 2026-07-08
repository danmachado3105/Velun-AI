"""
Extrator de texto de arquivos.

Cada tipo de arquivo (PDF, Word, texto simples) precisa de uma forma
diferente de leitura. Esta classe centraliza essa lógica, escondendo
os detalhes de cada biblioteca do resto do sistema.
"""

import io

from pypdf import PdfReader
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
            return self._extract_from_pdf(file_bytes)
        elif extension == ".docx":
            return self._extract_from_docx(file_bytes)
        elif extension in (".txt", ".md"):
            return file_bytes.decode("utf-8", errors="ignore")
        else:
            raise UnsupportedFileTypeError(
                f"Tipo de arquivo não suportado: {extension}"
            )

    def _get_extension(self, filename: str) -> str:
        """Extrai a extensão do arquivo (ex: '.pdf'), em minúsculas."""
        return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    def _extract_from_pdf(self, file_bytes: bytes) -> str:
        """Extrai texto de todas as páginas de um PDF."""
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        full_text = "\n\n".join(pages_text)
        return self._clean_spaced_text(full_text)

    def _clean_spaced_text(self, text: str) -> str:
        """
        Corrige um problema comum em PDFs de design (ex: feitos no Canva),
        onde cada letra é extraída separada por espaço (ex: "P a c o t e").

        Detecta esse padrão e reagrupa as letras em palavras normais.
        """
        import re

        # Detecta se o texto tem muitas sequências de "letra espaço letra".
        spaced_pattern = re.findall(r"\b\w\s\w\s\w", text)
        if len(spaced_pattern) < 5:
            return text  # Texto normal, não precisa corrigir.

        # Junta letras isoladas separadas por espaço simples, preservando
        # espaços duplos (que geralmente indicam separação real de palavras).
        text = re.sub(r"(?<=\w) (?=\w(?: |$))", "", text)
        return text

    def _extract_from_docx(self, file_bytes: bytes) -> str:
        """Extrai texto de todos os parágrafos de um Word."""
        document = Document(io.BytesIO(file_bytes))
        paragraphs = [paragraph.text for paragraph in document.paragraphs]
        return "\n".join(paragraphs)