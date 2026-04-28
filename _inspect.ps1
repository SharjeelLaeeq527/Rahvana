$lines = Get-Content 'd:\arachnie_work\updated_work\app\(tools)\(visa)\visa-category\ir-category\[visa-journey]\components\v2\ChapterView.tsx'
for ($i = 307; $i -le 313; $i++) {
    Write-Host ("{0}: [{1}]" -f ($i + 1), $lines[$i])
}
