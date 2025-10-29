export const POST = async (req: Request) => {
  try {
    const body: {
      lat: number;
      lng: number;
      measureUnit: 'Imperial' | 'Metric';
    } = await req.json();

    if (!body.lat || !body.lng) {
      return Response.json(
        {
          message: 'Requisição inválida.',
        },
        { status: 400 },
      );
    }

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${body.lat}&longitude=${body.lng}&current=weather_code,temperature_2m,is_day,relative_humidity_2m,wind_speed_10m&timezone=auto${
        body.measureUnit === 'Metric' ? '' : '&temperature_unit=fahrenheit'
      }${body.measureUnit === 'Metric' ? '' : '&wind_speed_unit=mph'}`,
    );

    const data = await res.json();

    if (data.error) {
      console.error(`Erro ao buscar dados climáticos: ${data.reason}`);
      return Response.json(
        {
          message: 'Ocorreu um erro.',
        },
        { status: 500 },
      );
    }

    const weather: {
      temperature: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      icon: string;
      temperatureUnit: 'C' | 'F';
      windSpeedUnit: 'm/s' | 'mph';
    } = {
      temperature: data.current.temperature_2m,
      condition: '',
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      icon: '',
      temperatureUnit: body.measureUnit === 'Metric' ? 'C' : 'F',
      windSpeedUnit: body.measureUnit === 'Metric' ? 'm/s' : 'mph',
    };

    const code = data.current.weather_code;
    const isDay = data.current.is_day === 1;
    const dayOrNight = isDay ? 'day' : 'night';

    switch (code) {
      case 0:
        weather.icon = `clear-${dayOrNight}`;
        weather.condition = 'Limpo';
        break;

      case 1:
        weather.condition = 'Predominantemente Limpo';
      case 2:
        weather.condition = 'Parcialmente Nublado';
      case 3:
        weather.icon = `cloudy-1-${dayOrNight}`;
        weather.condition = 'Nublado';
        break;

      case 45:
        weather.condition = 'Neblina';
      case 48:
        weather.icon = `fog-${dayOrNight}`;
        weather.condition = 'Neblina';
        break;

      case 51:
        weather.condition = 'Garoa Leve';
      case 53:
        weather.condition = 'Garoa Moderada';
      case 55:
        weather.icon = `rainy-1-${dayOrNight}`;
        weather.condition = 'Garoa Intensa';
        break;

      case 56:
        weather.condition = 'Garoa Congelante Leve';
      case 57:
        weather.icon = `frost-${dayOrNight}`;
        weather.condition = 'Garoa Congelante Intensa';
        break;

      case 61:
        weather.condition = 'Chuva Leve';
      case 63:
        weather.condition = 'Chuva Moderada';
      case 65:
        weather.condition = 'Chuva Forte';
        weather.icon = `rainy-2-${dayOrNight}`;
        break;

      case 66:
        weather.condition = 'Chuva Congelante Leve';
      case 67:
        weather.condition = 'Chuva Congelante Forte';
        weather.icon = 'rain-and-sleet-mix';
        break;

      case 71:
        weather.condition = 'Neve Leve';
      case 73:
        weather.condition = 'Neve Moderada';
      case 75:
        weather.condition = 'Neve Forte';
        weather.icon = `snowy-2-${dayOrNight}`;
        break;

      case 77:
        weather.condition = 'Neve';
        weather.icon = `snowy-1-${dayOrNight}`;
        break;

      case 80:
        weather.condition = 'Pancadas de Chuva Leves';
      case 81:
        weather.condition = 'Pancadas de Chuva Moderadas';
      case 82:
        weather.condition = 'Pancadas de Chuva Fortes';
        weather.icon = `rainy-3-${dayOrNight}`;
        break;

      case 85:
        weather.condition = 'Pancadas de Neve Leves';
      case 86:
        weather.condition = 'Pancadas de Neve Moderadas';
      case 87:
        weather.condition = 'Pancadas de Neve Fortes';
        weather.icon = `snowy-3-${dayOrNight}`;
        break;

      case 95:
        weather.condition = 'Tempestade';
        weather.icon = `scattered-thunderstorms-${dayOrNight}`;
        break;

      case 96:
        weather.condition = 'Tempestade com Granizo Leve';
      case 99:
        weather.condition = 'Tempestade com Granizo Forte';
        weather.icon = 'severe-thunderstorm';
        break;

      default:
        weather.icon = `clear-${dayOrNight}`;
        weather.condition = 'Limpo';
        break;
    }

    return Response.json(weather);
  } catch (err) {
    console.error('Ocorreu um erro ao obter widgets da home', err);
    return Response.json(
      {
        message: 'Ocorreu um erro.',
      },
      {
        status: 500,
      },
    );
  }
};
