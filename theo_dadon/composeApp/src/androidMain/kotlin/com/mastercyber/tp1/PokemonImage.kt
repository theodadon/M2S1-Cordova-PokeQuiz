package com.mastercyber.tp1

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.core.graphics.createBitmap

@Composable
fun PokemonImage(bytes: ByteArray?, modifier: Modifier = Modifier) {
    if (bytes == null) return

    val original: Bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return

    val width = original.width
    val height = original.height
    val pixels = IntArray(width * height)

    original.getPixels(pixels, 0, width, 0, 0, width, height)

    // conversion en N&B dans le code partagé
    val grayPixels = toGrayPixels(pixels)

    val grayBitmap = createBitmap(width, height)
    grayBitmap.setPixels(grayPixels, 0, width, 0, 0, width, height)

    Image(
        bitmap = grayBitmap.asImageBitmap(),
        contentDescription = null,
        modifier = modifier
    )
}
