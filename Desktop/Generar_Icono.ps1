Add-Type -AssemblyName System.Drawing

$Ruta_Png = Join-Path $PSScriptRoot "Semaplan.png"
$Ruta_Ico = Join-Path $PSScriptRoot "Semaplan.ico"
$Ruta_Temp = Join-Path $env:TEMP "Semaplan_Desktop_256.png"
$Tamano = 256

$Imagen_Origen = $null
$Lienzo = $null
$Grafico = $null

try {
  $Imagen_Origen =
    [System.Drawing.Image]::FromFile($Ruta_Png)
  $Lienzo = New-Object System.Drawing.Bitmap $Tamano, $Tamano
  $Grafico =
    [System.Drawing.Graphics]::FromImage($Lienzo)

  $Grafico.Clear([System.Drawing.Color]::Transparent)
  $Grafico.InterpolationMode =
    [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Grafico.SmoothingMode =
    [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $Grafico.PixelOffsetMode =
    [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Grafico.CompositingQuality =
    [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $Escala_X = $Tamano / $Imagen_Origen.Width
  $Escala_Y = $Tamano / $Imagen_Origen.Height
  $Escala = [Math]::Min($Escala_X, $Escala_Y)

  $Ancho_Destino =
    [int][Math]::Round($Imagen_Origen.Width * $Escala)
  $Alto_Destino =
    [int][Math]::Round($Imagen_Origen.Height * $Escala)
  $Offset_X = [int](($Tamano - $Ancho_Destino) / 2)
  $Offset_Y = [int](($Tamano - $Alto_Destino) / 2)

  $Grafico.DrawImage(
    $Imagen_Origen,
    (New-Object System.Drawing.Rectangle(
      $Offset_X,
      $Offset_Y,
      $Ancho_Destino,
      $Alto_Destino
    ))
  )

  $Lienzo.Save(
    $Ruta_Temp,
    [System.Drawing.Imaging.ImageFormat]::Png
  )

  $Bytes_Png = [System.IO.File]::ReadAllBytes($Ruta_Temp)
  $Stream = New-Object System.IO.MemoryStream
  $Writer = New-Object System.IO.BinaryWriter $Stream

  $Writer.Write([UInt16]0)
  $Writer.Write([UInt16]1)
  $Writer.Write([UInt16]1)

  $Writer.Write([Byte]0)
  $Writer.Write([Byte]0)
  $Writer.Write([Byte]0)
  $Writer.Write([Byte]0)
  $Writer.Write([UInt16]1)
  $Writer.Write([UInt16]32)
  $Writer.Write([UInt32]$Bytes_Png.Length)
  $Writer.Write([UInt32]22)
  $Writer.Write($Bytes_Png)
  $Writer.Flush()

  [System.IO.File]::WriteAllBytes(
    $Ruta_Ico,
    $Stream.ToArray()
  )
  Write-Output "Icono actualizado en $Ruta_Ico"
} finally {
  if ($Grafico) { $Grafico.Dispose() }
  if ($Lienzo) { $Lienzo.Dispose() }
  if ($Imagen_Origen) { $Imagen_Origen.Dispose() }
  if (Test-Path $Ruta_Temp) {
    Remove-Item -LiteralPath $Ruta_Temp -Force
  }
}
